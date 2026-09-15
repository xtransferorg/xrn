import { JSON5 } from "@wolfx/json5/src/main/ets/json5/";
import { APP_BUNDLE_BUNDLE_INFO_MANAGER } from "../Constants";
import { Context } from '@kit.AbilityKit';
import { buffer } from "@kit.ArkTS";
import { BundleInfo } from "./BundleInfo";
import { PreferencesStore } from "./PreferencesStore";

/**
 * Project 配置信息
 */
export class ProjectInfoOption {
  name: string = ""
}

/**
 * Bundle 配置信息
 */
export class BundleInfoOption {
  /**
   * bundle name
   */
  bundleName: string = ""
  /**
   * 是否主bundle
   */
  bundleType: string = ""
  /**
   * 默认 moduleName，main bundle 需要配置
   */
  defaultModuleName?: string = ""
  /**
   * 所有的 bundleName
   */
  moduleNames: string[] = []
  /**
   * CodePush Key
   */
  codePushKey: string = ""
  /**
   * 本地服务端口
   */
  port: number = 8081
}

/**
 * BundleInfoManager 配置信息
 */
export class BundleInfoManagerOptions {
  project: ProjectInfoOption | undefined
  bundles: BundleInfoOption[] = []
}

/**
 * 特殊信息Hook方法
 */
export class BundleInfoHook {
  hookCodePushKey: ((info: BundleInfo) => string) | undefined = undefined
  hookJSBundleName: ((info: BundleInfo) => string) | undefined = undefined
  hookLocalServerUrl: ((info: BundleInfo) => string) | undefined = undefined
  hookLocalServerPort: ((info: BundleInfo, initPort: number) => number) | undefined = undefined
}

const NAME_PREFERENCES = "nativeStore"
const KEY_LOCAL_BUNDLE_INFO_MAP_CACHE = "key-local-bundle-info-map-cache"

class LocalBundleInfo {
  bundleName: string;
  port: number;
}

/**
 * bundle 信息 管理类
 * 单例
 */
export class BundleInfoManager {

  private static TAG = "BundleInfoManager"

  static INSTANCE = new BundleInfoManager()

  private static isInitialized = false

  private options: BundleInfoManagerOptions | undefined
  private hook: BundleInfoHook | undefined

  private preferencesStore: PreferencesStore

  readonly BUNDLE_INFOS: BundleInfo[] = []

  readonly bundleInfoMap = new Map<string, BundleInfo>();

  private localBundleInfoMap: Map<string, LocalBundleInfo> = new Map<string, LocalBundleInfo>();


  static init(options: BundleInfoManagerOptions, preference: PreferencesStore, hook?: BundleInfoHook) {
    BundleInfoManager.assertNotInitialized('init')
    BundleInfoManager.isInitialized = true
    BundleInfoManager.INSTANCE.init(options, preference, hook)
  }

  static async initWithRawFile(context: Context, rawFilePath: string, preference: PreferencesStore, hook: BundleInfoHook | undefined) {
    BundleInfoManager.assertNotInitialized('initWithRawFile')
    BundleInfoManager.isInitialized = true
    BundleInfoManager.loadOptionsFromRawFile(context, rawFilePath, preference, hook)
  }

  private static loadOptionsFromRawFile(context: Context, rawFilePath: string, preference: PreferencesStore, hook: BundleInfoHook | undefined) {
    const  content : Uint8Array | undefined = context?.resourceManager?.getRawFileContentSync(rawFilePath)
    const result = buffer.from(content).toString('utf-8')
    const options: BundleInfoManagerOptions = JSON5.parse(result)
    BundleInfoManager.INSTANCE.init(options, preference, hook)
  }

  private constructor() {
  }

  private static assertInitialized(tag?: string) {
    if (!BundleInfoManager.isInitialized) {
      throw new Error(`${BundleInfoManager.TAG}.${tag}:BundleInfoManager has not initialized`)
    }
  }

  private static assertNotInitialized(tag?: string) {
    if (BundleInfoManager.isInitialized) {
      throw new Error(`${BundleInfoManager.TAG}.${tag}:BundleInfoManager has initialized`)
    }
  }

  private init(options: BundleInfoManagerOptions, preference: PreferencesStore, hook: BundleInfoHook | undefined) {
    this.options = options
    this.preferencesStore = preference
    this.hook = hook
    for (let index = 0; index < options.bundles.length; index++) {
      const infoOption = options.bundles[index];
      if (this.bundleInfoMap.has(infoOption.bundleName)) {
        throw new Error(`${BundleInfoManager.TAG}.constructor:bundle name has set, info.bundleName=${infoOption.bundleName}`)
      }
      const info = new BundleInfo(infoOption.bundleName, infoOption.bundleType, infoOption.defaultModuleName, infoOption.moduleNames, infoOption.codePushKey, infoOption.port)
      info.setHook(this.hook)
      this.BUNDLE_INFOS.push(info)
      this.bundleInfoMap.set(info.bundleName, info)
    }
    this.localBundleInfoMap = this.getLocalBundleInfoMapFromCache()
    this.localBundleInfoMap.forEach((value) => {
      this.registerDevBundleInfo(value.bundleName, value.port)
    })
    AppStorage.setOrCreate<BundleInfoManager>(APP_BUNDLE_BUNDLE_INFO_MANAGER, this)
  }

  getLocalBundleInfoMapFromCache(): Map<string, LocalBundleInfo> {
    const localBundleInfoMapJson = this.preferencesStore.get(KEY_LOCAL_BUNDLE_INFO_MAP_CACHE, NAME_PREFERENCES);
    const localBundleInfoMap: Map<string, LocalBundleInfo> = JSON5.parse(localBundleInfoMapJson) as Map<string, LocalBundleInfo>;
    return localBundleInfoMap;
  }

  getLocalBundleInfoMap(): Map<string, LocalBundleInfo> {
    return this.localBundleInfoMap;
  }

  saveLocalBundleList2Cache() {
    const localBundleListJson = JSON5.stringify(this.localBundleInfoMap)
    this.preferencesStore.put(KEY_LOCAL_BUNDLE_INFO_MAP_CACHE, localBundleListJson, NAME_PREFERENCES)
  }

  registerDevBundleInfo(bundleName: string, port: number) {
    if (!bundleName || !port) {
      return;
    }
    let bundleInfo = this.getBundleInfo(bundleName)
    if (bundleInfo) {
      if (bundleInfo.getDeliveryType() === BundleInfo.DELIVERY_TYPE_LOCAL) {
        // bundleName 对应的是 local bundle
        bundleInfo.setLocalServerPort(port);
        this.localBundleInfoMap[bundleName].port = port;
        this.saveLocalBundleList2Cache();
      } else {
        // bundleName 对应的是其他 bundle
        bundleInfo.setLocalServerPort(port);
        const cacheDebugJson: string = this.preferencesStore.get(`${bundleName}-debug`, NAME_PREFERENCES) as string
        const debugInfo = JSON.parse(cacheDebugJson)
        debugInfo.port = port
        const refreshDebugJson = JSON5.stringify(debugInfo)
        this.preferencesStore.put(`${bundleName}-debug`, refreshDebugJson, NAME_PREFERENCES)
      }
    } else {
      const localBundleInfo = new LocalBundleInfo()
      localBundleInfo.bundleName = bundleName
      localBundleInfo.port = port
      this.localBundleInfoMap[bundleName] = localBundleInfo
      this.saveLocalBundleList2Cache()
      const bundleInfo = this.convertLocalBundle2Bundle(localBundleInfo)
      this.registerBundleInfo(bundleInfo)
    }
  }

  private convertLocalBundle2Bundle(bundle: LocalBundleInfo): BundleInfo {
    return bundle ? new BundleInfo(bundle.bundleName, "", "", [], "", bundle.port, BundleInfo.DELIVERY_TYPE_LOCAL) : undefined
  }

  /**
   * 根据 bundleName 获取 BundleInfo
   * @param bundleName
   * @returns
   */
  getBundleInfo(bundleName: string): BundleInfo | undefined {
    BundleInfoManager.assertInitialized('getBundleInfo')
    return this.bundleInfoMap.get(bundleName)
  }

  registerBundleInfo(bundleInfo: BundleInfo): boolean {
    if (!bundleInfo || !bundleInfo.bundleName) {
      return false
    } else if (this.bundleInfoMap.has(bundleInfo.bundleName)) {
      return false
    }
    bundleInfo.setHook(this.hook)
    this.BUNDLE_INFOS.push(bundleInfo)
    this.bundleInfoMap.set(bundleInfo.bundleName, bundleInfo)
  }

  /**
   * 指定 bundle 是否已注册
   * @param bundleName
   * @returns
   */
  isBundleRegistered(bundleName: string): boolean {
    BundleInfoManager.assertInitialized('isBundleRegistered')
    return this.getBundleInfo(bundleName) ? true : false
  }

  /**
   * 获取 main bundle
   * @returns
   */
  getMainBundleInfo(): BundleInfo | null {
    BundleInfoManager.assertInitialized('getMainBundleInfo')
    const mainBundle = this.BUNDLE_INFOS.filter((value: BundleInfo, index: number, array: BundleInfo[]) => {
      return value.bundleType === BundleInfo.BUNDLE_TYPE_MAIN
    })
    return mainBundle.length > 0 ? mainBundle[0] : null
  }

  findBundleInfoByPort(port: string | number): BundleInfo | null {
    const item = this.options?.bundles.find(it => it.port.toString() === port.toString())
    if(item?.bundleName) {
      return this.getBundleInfo(item.bundleName)
    }
    return null
  }

}







