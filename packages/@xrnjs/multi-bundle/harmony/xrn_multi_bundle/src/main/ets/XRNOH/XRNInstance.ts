import resourceManager from "@ohos.resourceManager";
import { HttpClient } from "@rnoh/react-native-openharmony/src/main/ets/HttpClient/ts";
import { DevServerHelper } from "@rnoh/react-native-openharmony/src/main/ets/RNOH/DevServerHelper";
import { DevToolsController } from "@rnoh/react-native-openharmony/src/main/ets/RNOH/DevToolsController";
import { DisplayMetricsManager } from "@rnoh/react-native-openharmony/src/main/ets/RNOH/DisplayMetricsManager";
import type { HttpClientProvider } from "@rnoh/react-native-openharmony/src/main/ets/RNOH/HttpClientProvider";
import { JSBundleProvider,
  JSBundleProviderError } from "@rnoh/react-native-openharmony/src/main/ets/RNOH/JSBundleProvider";
import type { NapiBridge } from "@rnoh/react-native-openharmony/src/main/ets/RNOH/NapiBridge";
import {
  BundleExecutionStatus,
  LifecycleState,
  RNInstanceImpl } from "@rnoh/react-native-openharmony/src/main/ets/RNOH/RNInstance";
import type { UITurboModuleContext } from "@rnoh/react-native-openharmony/src/main/ets/RNOH/RNOHContext";
import { RNOHError, RNOHErrorEventEmitter } from "@rnoh/react-native-openharmony/src/main/ets/RNOH/RNOHError";
import type { RNOHLogger } from '@rnoh/react-native-openharmony/src/main/ets/RNOH/RNOHLogger'
import { WorkerThread } from "@rnoh/react-native-openharmony/src/main/ets/RNOH/WorkerThread";

import { XRNJSPackagerClient } from "./XRNJSPackagerClient";

export class XRNInstanceImpl extends RNInstanceImpl {
  private jsPackagerClient: XRNJSPackagerClient | undefined;
  private xlogger: RNOHLogger;
  private xdevToolsController: DevToolsController;

  constructor(
    envId: number,
    private idX: number,
    name: string | undefined,
    injectedLogger: RNOHLogger,
    globalRNOHErrorEventEmitter: RNOHErrorEventEmitter,
    private napiBridgeX: NapiBridge,
    disableConcurrentRoot: boolean | undefined,
    devToolsController: DevToolsController,
    createUITurboModuleContext: (rnInstance: RNInstanceImpl) => UITurboModuleContext,
    private workerThreadX: WorkerThread | undefined,
    private shouldEnableDebuggerX: boolean,
    shouldEnableBackgroundExecutor: boolean,
    shouldUseNDKToMeasureText: boolean,
    shouldUseImageLoader: boolean,
    shouldUseCAPIArchitecture: boolean,
    assetsDest: string,
    resourceManager: resourceManager.ResourceManager,
    arkTsComponentNames: Array<string>,
    displayMetricsManager: DisplayMetricsManager,
    fontPathByFontFamily: Record<string, string>,
    httpClientProvider: HttpClientProvider,
    httpClient: HttpClient | undefined, // TODO: remove "undefined" when HttpClientProvider is removed
    backPressHandler?: () => void,
  ) {
    super(
      envId,
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
      shouldEnableBackgroundExecutor,
      shouldUseNDKToMeasureText,
      shouldUseImageLoader,
      shouldUseCAPIArchitecture,
      assetsDest,
      resourceManager,
      arkTsComponentNames,
      displayMetricsManager,
      fontPathByFontFamily,
      httpClientProvider,
      httpClient,
      backPressHandler,
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

  private getLoggerInner(): RNOHLogger {
    return (this as any).logger;
  }

  private getBundleExecutionStatusByBundleURLInner(): Map<
    string,
    BundleExecutionStatus
  > {
    return (this as any).bundleExecutionStatusByBundleURL;
  }

  private getInitialBundleUrlInner(): string | undefined {
    return (this as any).initialBundleUrl;
  }

  private setInitialBundleUrlInner(url: string | undefined) {
    (this as any).initialBundleUrl = url;
  }

  private getLifecycleStateInner(): LifecycleState {
    return (this as any).lifecycleState;
  }

  private setLifecycleStateInner(state: LifecycleState) {
    (this as any).lifecycleState = state;
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

  public async runJSBundle(
    jsBundleProvider: JSBundleProvider,
    info?: string | null,
  ) {
    // await super.runJSBundle(jsBundleProvider, info)
    // 父类实现 copy - start
    // bugfix: bundleURL 没初始化，导致 jsBundleProvider.getURL() 没有对应的 RUNNING 状态
    // let bundleURL: string
    let bundleURL: string = jsBundleProvider.getURL();
    const stopTracing = this.getLoggerInner().clone("runJSBundle").startTracing();
    const isMetroServer = jsBundleProvider.getHotReloadConfig() !== null;
    try {
      if (info === undefined) {
        this.xdevToolsController.eventEmitter.emit(
          "SHOW_DEV_LOADING_VIEW",
          this.idX,
          `Loading from ${jsBundleProvider.getHumanFriendlyURL()}...`,
        );
      } else if (info) {
        this.xdevToolsController.eventEmitter.emit(
          "SHOW_DEV_LOADING_VIEW",
          this.idX,
          `${info.slice(0, 255)}`,
        );
      }

      this.getBundleExecutionStatusByBundleURLInner().set(bundleURL, "RUNNING");
      this.logMarker("DOWNLOAD_START");
      const jsBundle = await jsBundleProvider.getBundle((progress) => {
        this.xdevToolsController.eventEmitter.emit(
          "SHOW_DEV_LOADING_VIEW",
          this.idX,
          `Loading from ${jsBundleProvider.getHumanFriendlyURL()} (${Math.round(progress * 100)}%)`,
        );
      });
      this.logMarker("DOWNLOAD_END");
      bundleURL = jsBundleProvider.getURL();
      this.setInitialBundleUrlInner(this.getInitialBundleUrlInner() ?? bundleURL)
      // this.initialBundleUrl = this.initialBundleUrl ?? bundleURL;

      await this.napiBridgeX.loadScript(this.idX, jsBundle, bundleURL);
      this.napiBridgeX.setBundlePath(this.idX, bundleURL);
      // this.lifecycleState = LifecycleState.READY;
      this.setLifecycleStateInner(LifecycleState.READY)
      const hotReloadConfig = jsBundleProvider.getHotReloadConfig();
      if (hotReloadConfig) {
        this.callRNFunction("HMRClient", "setup", [
          "harmony",
          hotReloadConfig.bundleEntry,
          hotReloadConfig.host,
          hotReloadConfig.port,
          true,
        ]);
        this.getLoggerInner().info("Configured hot reloading");
      }
      const isRemoteBundle = bundleURL.startsWith("http");
      if (this.shouldEnableDebuggerX && isRemoteBundle) {
        DevServerHelper.connectToDevServer(
          bundleURL,
          this.getLoggerInner(),
          this.napiBridgeX.getInspectorWrapper(),
        );
      }
      this.getBundleExecutionStatusByBundleURLInner().set(bundleURL, "DONE");
      this.lifecycleEventEmitter.emit("JS_BUNDLE_EXECUTION_FINISH", {
        jsBundleUrl: bundleURL,
        appKeys: jsBundleProvider.getAppKeys(),
      });
      this.workerThreadX?.postMessage("JS_BUNDLE_EXECUTION_FINISH", {
        rnInstanceId: this.idX,
      });
    } catch (err) {
      this.getBundleExecutionStatusByBundleURLInner().delete(bundleURL);
      if (err instanceof JSBundleProviderError) {
        this.reportRNOHError(err);
      } else {
        const suggestions: string[] = [];
        if (isMetroServer) {
          suggestions.push(
            "Please check your Metro Server console. Likely, the error details you need are displayed there.",
          );
        }
        suggestions.push(
          "Please revise your application code. It may contain syntax errors or unhandled exceptions at the top level that could be causing runtime failures.",
        );
        this.reportRNOHError(
          new RNOHError({
            whatHappened: "Couldn't run a JS bundle",
            howCanItBeFixed: suggestions,
            extraData: err,
          }),
        );
      }
    } finally {
      this.xdevToolsController.eventEmitter.emit(
        "HIDE_DEV_LOADING_VIEW",
        this.idX,
      );
      stopTracing();
    }
    // 父类实现 copy - end
    const config = jsBundleProvider.getHotReloadConfig();
    if (config) {
      // TODO reload 修复后打开
      // this.jsPackagerClient?.connectToMetroMessages({
      //   host: config.host,
      //   port: config.port
      // })
    }


    this.connectMetro(jsBundleProvider)
  }

  public onCreate() {
    super.onCreate();
  }


  public async onDestroy() {
    this.jsPackagerClient?.onDestroy()
    super.onDestroy();
  }
}

