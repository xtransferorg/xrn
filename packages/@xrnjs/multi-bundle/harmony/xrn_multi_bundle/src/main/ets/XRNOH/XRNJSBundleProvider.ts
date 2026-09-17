import {
  AnyJSBundleProvider,
  JSBundleProvider,
  MetroJSBundleProvider,
  TraceJSBundleProviderDecorator} from "@rnoh/react-native-openharmony/src/main/ets/RNOH/JSBundleProvider";
import { isPreloadable, Preloadable, TAG_PRELOAD } from "../bundle/Preloadable";
import { emitter } from '@kit.BasicServicesKit';
import http from '@ohos.net.http';
import util from '@ohos.util';
import { isSplitMode } from "../bundle/BundleHelper";
import promptAction from "@ohos.promptAction"
import {
  DEFAULT_HTTP_CONNECT_TIMEOUT_MILLS,
  DEFAULT_HTTP_READ_TIMEOUT_MILLS,
  DEFAULT_HTTP_TOTAL_TIMEOUT_MILLS,
  requestArrayBufferInStream,
} from './HttpStreamRequest';


/**
 * JSBundleProvider 扩展接口
 */
export interface JSBundleProviderEx {
  updateAppKeys(appKeys: string[]);
}

function getAppKeysInner(jsBundleProvider: JSBundleProvider): string[] {
  let array: string[] = (jsBundleProvider as any).appKeys
  if (!array) {
    array = [];
    (jsBundleProvider as any).appKeys = array
  }
  return array
}

/**
 * 更新 JSBundleProvider 中有 appKeys 数据
 * @param jsBundleProvider
 * @param appKeys
 */
export function updateJSBundleProviderAppKeys(jsBundleProvider: JSBundleProvider, appKeys: string[]) {

  if (isJSBundleProviderEx(jsBundleProvider)) {
    //如果 JSBundleProvider 实现了 JSBundleProviderEx，直接调用 updateAppKeys
    jsBundleProvider.updateAppKeys(appKeys)
  } else if ('appKeys' in jsBundleProvider) {
    //否则，直接更新内部的 appKeys 成员变量数据；
    const appKeyArray = getAppKeysInner(jsBundleProvider)
    appKeyArray.length = 0
    appKeys.forEach((value) => {
      appKeyArray.push(value)
    })
  } else {
    console.warn('updateJSBundleProviderAppKeys invalid jsBundleProvider = ', jsBundleProvider.constructor.name)
  }
}

function isJSBundleProviderEx(jsBundleProvider: any): jsBundleProvider is JSBundleProviderEx {
  //方法名需要 JSBundleProviderEx 中的方法名保持一致
  return jsBundleProvider && typeof jsBundleProvider.updateAppKeys === 'function'
}

export class XRNAnyJSBundleProvider extends AnyJSBundleProvider implements JSBundleProviderEx, Preloadable {

  private getJsBundleProviders(): JSBundleProvider[] {
    return (this as any).jsBundleProviders
  }

  updateAppKeys(appKeys: string[]): void {
    const jsBundleProviders = this.getJsBundleProviders()
    for (const provider of jsBundleProviders) {
      updateJSBundleProviderAppKeys(provider, appKeys)
    }
  }

  /**
   * 并发调用所有内层实现了 Preloadable 的 provider.preload()，失败静默忽略。
   */
  async preload(): Promise<void> {
    const promises = this.getJsBundleProviders()
      .filter(p => isPreloadable(p))
      .map(p => (p as Preloadable).preload().catch(err => {
        console.warn(`${TAG_PRELOAD}-XRNAnyJSBundleProvider.preload: inner provider failed=${JSON.stringify(err)}`)
      }))
    await Promise.all(promises)
  }

}

export class XRNMetroJSBundleProvider extends MetroJSBundleProvider implements JSBundleProviderEx {

  private bundleName: string

  constructor(bundleName:string, url: string, appKeys?: string[]) {
    super(url, appKeys)
    this.bundleName = bundleName
  }

  updateAppKeys(appKeys: string[]): void {
    // 直接操作内部 appKeys，避免经 updateJSBundleProviderAppKeys 再分发导致无限递归
    const array: string[] = (this as any).appKeys ?? []
    ;(this as any).appKeys = array
    array.length = 0
    appKeys.forEach((v) => array.push(v))
  }

  async getBundle(
    onProgress?: (progress: number) => void,
    onProviderSwitch?: (currentProvider: JSBundleProvider) => void
  ): Promise<ArrayBuffer> {
    let manifestContent: string | undefined;
    try {
      const rnohCoreContext = AppStorage.get('RNOHCoreContext') as any;
      if (rnohCoreContext?.uiAbilityContext?.resourceManager) {
        const rawData =
          await rnohCoreContext.uiAbilityContext.resourceManager.getRawFileContent('xrn-manifest.json');
        manifestContent = new util.TextDecoder('utf-8').decodeWithStream(new Uint8Array(rawData.buffer));
      }
    } catch(err) {
      // xrn-manifest.json 不存在，回退到 GET 请求
      console.warn(`Failed to load xrn-manifest.json, fallback to GET request: ${JSON.stringify(err)}`)
    }

    if(isSplitMode(this.bundleName)) {
        if(manifestContent) {
          return this.getBundleViaPost(manifestContent, onProgress);
        } else {
          console.error('Split mode enabled but failed to load manifest content')
          promptAction.showToast({message: "Split mode enabled but failed to load manifest content", duration: 3000, showMode: promptAction.ToastShowMode.TOP_MOST})
          throw new Error('Split mode enabled but failed to load manifest content')
        }
    } else {
      return super.getBundle(onProgress, onProviderSwitch) as Promise<ArrayBuffer>;
    }
  }

  private getBundleViaPost(
    body: string,
    onProgress?: (progress: number) => void
  ): Promise<ArrayBuffer> {
    const bundleUrl = this.getURL()
    return requestArrayBufferInStream({
      url: bundleUrl,
      method: http.RequestMethod.POST,
      header: { 'Content-Type': 'application/json' },
      body,
      connectTimeoutMills: DEFAULT_HTTP_CONNECT_TIMEOUT_MILLS,
      readTimeoutMills: 3 * 60_000, // POST 请求可能比较慢，读超时设置为 3 分钟
      timeoutMills: 3 * 60_000 + DEFAULT_HTTP_CONNECT_TIMEOUT_MILLS, // 总超时设置为连接超时 + 读超时
      onProgress,
    })
  }

}

export class XRNTraceJSBundleProviderDecorator extends TraceJSBundleProviderDecorator implements JSBundleProviderEx, Preloadable {

  private getJSBundleProvider(): JSBundleProvider | undefined {
    return (this as any).jsBundleProvider
  }

  updateAppKeys(appKeys: string[]): void {
    const jsBundleProvider = this.getJSBundleProvider()
    updateJSBundleProviderAppKeys(jsBundleProvider, appKeys)
  }

  async preload(): Promise<void> {
    const inner = this.getJSBundleProvider()
    if (inner && isPreloadable(inner)) {
      await inner.preload()
    }
  }

}
