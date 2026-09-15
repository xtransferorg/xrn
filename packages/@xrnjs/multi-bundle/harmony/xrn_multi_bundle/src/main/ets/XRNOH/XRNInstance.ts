import { DevToolsController } from "@rnoh/react-native-openharmony/src/main/ets/RNOH/DevToolsController";
import {
  JSBundleProvider,
  JSBundleProviderError,
  JSEngineName,
  NapiBridge,
  ResourceJSBundleProvider,
  RNInstanceImpl,
  RNOHError,
  RNOHErrorEventEmitter,
  RNOHLogger,
  RNPackage,
  UITurboModuleContext,
  WorkerThread } from "@rnoh/react-native-openharmony/ts";
import { XRNJSPackagerClient } from "../XRNOH/XRNJSPackagerClient";
import { resourceManager } from "@kit.LocalizationKit";
import { CAPathProvider, HttpClient } from "@rnoh/react-native-openharmony/src/main/ets/HttpClient/HttpClient";
import { BundleExecutionStatus, JSVMInitOption } from "@rnoh/react-native-openharmony/src/main/ets/RNOH/RNInstance";
import { common } from "@kit.AbilityKit";
import { RN_INSTANCE_MANAGER } from "../bundle/RNInstanceManager";
import { BundleInfo } from "../bundle/BundleInfo";
import { isPreloadable, TAG_PRELOAD } from "../bundle/Preloadable";
import { isSplitMode } from "../bundle/BundleHelper";
import { JSON } from "@kit.ArkTS";

export class XRNInstanceImpl extends RNInstanceImpl {

  private bundleInfo: BundleInfo | undefined = undefined;

  private jsPackagerClient: XRNJSPackagerClient | undefined;
  private xlogger: RNOHLogger;
  private xdevToolsController: DevToolsController;
  //用来加载 common bundle
  private commonBundleJSBundleProvider: ResourceJSBundleProvider | undefined = undefined
  private bizBundleLoaded: boolean = false

  constructor(
    envId: number,
    isDebugModeEnabled: boolean,
    jsEngineName: JSEngineName,
    private idX: number,
    name: string | undefined,
    injectedLogger: RNOHLogger,
    globalRNOHErrorEventEmitter: RNOHErrorEventEmitter,
    private napiBridgeX: NapiBridge,
    disableConcurrentRoot: boolean | undefined,
    devToolsController: DevToolsController,
    createUITurboModuleContext: (
      rnInstance: RNInstanceImpl,
    ) => UITurboModuleContext,
    private workerThreadX: WorkerThread | undefined,
    private shouldEnableDebuggerX: boolean,
    shouldDisablePartialSyncOfDescriptorRegistryInCAPI: boolean,
    assetsDest: string,
    resourceManager: resourceManager.ResourceManager,
    fontPathByFontFamily: Record<string, string>,
    imageSourceByName: Record<string, string>,
    _httpClient: HttpClient,
    _caPathProvider: CAPathProvider,
    backPressHandler?: () => void,
    jsvmInitOptions?: ReadonlyArray<JSVMInitOption>,
    hspModuleName?: string,
  ) {
    super(
      envId,
      isDebugModeEnabled,
      jsEngineName,
      idX,
      name,
      injectedLogger,
      globalRNOHErrorEventEmitter,
      napiBridgeX,
      disableConcurrentRoot,
      devToolsController,
      createUITurboModuleContext,
      workerThreadX,
      shouldEnableDebuggerX,
      shouldDisablePartialSyncOfDescriptorRegistryInCAPI,
      assetsDest,
      resourceManager,
      fontPathByFontFamily,
      imageSourceByName,
      _httpClient,
      _caPathProvider,
      backPressHandler,
      jsvmInitOptions,
      hspModuleName,
    )

    this.xlogger = injectedLogger.clone('XRNInstance');
    this.xdevToolsController = devToolsController
    this.jsPackagerClient = new XRNJSPackagerClient(
      this.xlogger,
      (message, config) => {
        switch (message.method) {
          case "devMenu":
            // this.devMenu?.show()
            break;
          case "reload":
            // this.xdevToolsController.reload(JSON.stringify(config))
            this.lifecycleEventEmitter.emit("RELOAD", {
              reason: JSON.stringify(config)
            })
            break;
          default:
            this.xlogger.warn(`Unsupported action: ${message.method}`)
        }
      }
    );
  }

  public setBundleInfo(bundleInfo: BundleInfo) {
    console.log(`${TAG_PRELOAD}-XRNInstanceImpl.setBundleInfo: bundleName=${bundleInfo.bundleName}, this.bundleInfo=${JSON.stringify(this.bundleInfo)}, bundleInfo=${JSON.stringify(bundleInfo)}`)
    if (this.bundleInfo) {
      return
    }
    this.bundleInfo = bundleInfo
    // 通知所有实现了 BundleInfoUpdatable 的 TurboModulesFactory 更新 bundleName
    const factories: any[] = (this as any).turboModuleProvider?.turboModulesFactories ?? []
    for (const factory of factories) {
      if (typeof factory?.updateBundleInfo === 'function') {
        console.log(`${TAG_PRELOAD}-getConfiguration.XRNInstanceImpl.setBundleInfo: updating factory ${factory.constructor.name} with bundleName=${bundleInfo.bundleName}`)
        factory.updateBundleInfo(bundleInfo.bundleName)
      }
    }

    const turboModules: any[] = (this as any).turboModuleProvider?.cachedTurboModuleByName ?? {}

    Object.keys(turboModules).forEach((key: string) => {
      const module: string = turboModules[key]
      if (typeof (module as any)?.updateBundleInfo === 'function') {
        console.log(`${TAG_PRELOAD}-getConfiguration.XRNInstanceImpl.setBundleInfo: updating module ${module.constructor.name} with bundleName=${bundleInfo.bundleName}`);
        (module as any).updateBundleInfo(bundleInfo.bundleName)
      }

    })
  }

  /**
   * 仅加载 common bundle，供 preloadCommon() 调用。幂等。
   */
  public async loadCommonBundle(): Promise<void> {
    console.log(`${TAG_PRELOAD}-XRNInstance.loadCommonBundle`)
    if (this.hasLoadCommonBundle()) return
    await this.runCommonJSBundleInner()
  }

  private hasLoadCommonBundle(): boolean {
    const commonBundleName = RN_INSTANCE_MANAGER.getOptions()?.getSplitBundleOptions()?.getCommonBundleName() ?? "oh.xt-app-common.bundle"
    return this.getBundleExecutionStatusByBundleURL().get(commonBundleName) === "DONE"
  }

  private getUIAbilityContext(): common.UIAbilityContext | undefined {
    return (this as any).uiAbilityContext
  }

  private getBundleExecutionStatusByBundleURL(): Map<string, BundleExecutionStatus> {
    return ((this as any).bundleExecutionStatusByBundleURL)
  }

  private connectMetro(
    jsBundleProvider: JSBundleProvider,
  ) {
    const config = jsBundleProvider.getHotReloadConfig()
    if(config && config.port) {
      this.jsPackagerClient?.connectToMetroMessages({
        port: config.port,
        host: config.host
      })
    }
  }

  /**
   * 加载 biz bundle。
   * - common 未加载：并发执行 runCommonJSBundleInner + jsBundleProvider.preload()（热更新预检）
   * - common 已加载（来自预备池）：仅等待 preload() 后加载 biz
   */
  public async runJSBundle(jsBundleProvider: JSBundleProvider): Promise<void> {
    const needRunCommonJSBundle = await this.isNeedRunCommonJSBundle()
    console.log(`${TAG_PRELOAD}-XRNInstance.runJSBundle: bundleName=${this.bundleInfo?.bundleName}, jsBundleProvider=${jsBundleProvider}, needRunCommonJSBundle=${needRunCommonJSBundle}`)
    if (needRunCommonJSBundle) {
      const preloadPromise = isPreloadable(jsBundleProvider)
      ? jsBundleProvider.preload().catch(err => {
          this.xlogger.warn(`runJSBundle.preload silently failed: ${JSON.stringify(err)}`)
        })
      : Promise.resolve()
      // common 加载 与 热更新预检 并发执行；common 报错时打标记后继续向上抛
      try {
        await Promise.all([
          this.runCommonJSBundleInner(),
          preloadPromise,
        ])
        console.log(`${TAG_PRELOAD}-XRNInstance.runJSBundle: runCommonBundle & CodePush Preload success, continue to run biz bundle`)
      } catch (err) {
        console.log(`${TAG_PRELOAD}-XRNInstance.runJSBundle: runCommonBundle & CodePush failed, err=${JSON.stringify(err)}`)
        const e = err instanceof Error ? err : new Error(String(err))
        ;(e as any).isCommonBundleError = true
        throw e
      }
    }

    // LCP 打点：biz bundle 实际开始加载（common 已就绪，开始执行 biz JS）
    const bizBundleName = this.bundleInfo?.bundleName ?? '';
    if (bizBundleName) {
      RN_INSTANCE_MANAGER.getBundleLoadTracker()?.markBizBundleLoadStart(bizBundleName);
    }

    if (!this.bizBundleLoaded) {
      this.bizBundleLoaded = true
      // 在加载biz前，处理pendingUpdate，下一个版本分析最佳解决方案
      this.tryInitializeCodePushBeforeLoadBizBundle();
    }

    await super.runJSBundle(jsBundleProvider)
    this.connectMetro(jsBundleProvider)
  }

  private tryInitializeCodePushBeforeLoadBizBundle(): void {
    try {
      const codePushModule = this.getTurboModule?.("RTNCodePush") as any
      codePushModule?.beforeLoadBizBundleHandlePendingUpdate?.()
    } catch (err) {
      this.xlogger.warn(`tryInitializeCodePushBeforeBizBundle failed: ${JSON.stringify(err)}`)
    }
  }
  
  private async isNeedRunCommonJSBundle(): Promise<boolean> {
    if (this.hasLoadCommonBundle()) return false
    return isSplitMode(this.bundleInfo?.bundleName)
  }

  private async runCommonJSBundleInner() {
    console.log(`${TAG_PRELOAD}-XRNInstance.runCommonJSBundleInner`)

    if (!this.commonBundleJSBundleProvider) {
      const commonBundleName = RN_INSTANCE_MANAGER.getOptions()?.getSplitBundleOptions()?.getCommonBundleName()
      this.commonBundleJSBundleProvider = new ResourceJSBundleProvider(this.getUIAbilityContext()!.resourceManager, commonBundleName ?? "oh.xt-app-common.bundle")
    }

    let bundleURL: string = "";
    const activeBundleUrl = this.commonBundleJSBundleProvider.getURL();
    if (!activeBundleUrl) {
      console.log(`XRNInstance.runCommonJSBundleInner:No common bundle URL found for bundle ${this.bundleInfo?.bundleName}, skip running common JS bundle`)
      throw new Error("XRNInstance.runCommonJSBundleInner:Couldn't find the common JS bundle URL")
    }
    const stopTracing = this.xlogger.clone('runCommonJSBundle').startTracing();
    try {
      this.getBundleExecutionStatusByBundleURL().set(activeBundleUrl, "RUNNING");
      this.logMarker('DOWNLOAD_START');
      // LCP 打点：common bundle 开始加载（含下载阶段）
      // 仅当 biz_bundle_load_start 已被设置（onSetup 已触发）时才记录，从而自然跳过预加载场景
      const lcpBundleName = this.bundleInfo?.bundleName ?? '';
      if (lcpBundleName) {
        RN_INSTANCE_MANAGER.getBundleLoadTracker()?.markCommonBundleLoadStart(lcpBundleName);
      }
      const jsBundle = await this.commonBundleJSBundleProvider.getBundle(progress => {
        console.log(`runCommonJSBundleInner:progress=${progress}`)
      }, undefined);
      this.logMarker('DOWNLOAD_END');
      bundleURL = this.commonBundleJSBundleProvider?.getURL() ?? "";

      await this.napiBridgeX.loadScript(
        this.idX,
        jsBundle,
        bundleURL,
      );

      // LCP 打点：common bundle 加载完成
      if (lcpBundleName) {
        RN_INSTANCE_MANAGER.getBundleLoadTracker()?.markCommonBundleLoadEnd(lcpBundleName);
      }

      this.getBundleExecutionStatusByBundleURL().set(bundleURL, 'DONE');
      console.log(`${TAG_PRELOAD}-XRNInstance.runCommonJSBundleInner: success=====`)
    } catch (err) {
      console.log(`${TAG_PRELOAD}-XRNInstance.runCommonJSBundleInner: fail, err=${JSON.stringify(err)}`)
      this.getBundleExecutionStatusByBundleURL().delete(activeBundleUrl);
      if (err instanceof JSBundleProviderError) {
        this.reportRNOHError(err)
      } else {
        const suggestions: string[] = [];
        suggestions.push("Please revise your application code. It may contain syntax errors or unhandled exceptions at the top level that could be causing runtime failures.")
        this.reportRNOHError(new RNOHError({
          whatHappened: "Couldn't run a common JS bundle",
          howCanItBeFixed: suggestions,
          extraData: err,
        }))
      }
      throw err  // 让调用方能区分 common 阶段错误与 biz 阶段错误
    } finally {
      stopTracing();
    }
  }

  public async onDestroy(shouldTryDisconnectingDebugger: boolean = true) {
    if (shouldTryDisconnectingDebugger) {
      this.jsPackagerClient?.onDestroy()
    }
    super.onDestroy(shouldTryDisconnectingDebugger);
  }

}