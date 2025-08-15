import type common from '@ohos.app.ability.common'
import window from '@ohos.window';
import { RNOHLogger } from "@rnoh/react-native-openharmony/src/main/ets/RNOH/RNOHLogger"
import { NapiBridge } from '@rnoh/react-native-openharmony/src/main/ets/RNOH/NapiBridge';
import { XRNInstanceRegistry } from './XRNInstanceRegistry';
import { RNOHContext, RNOHCoreContext } from "@rnoh/react-native-openharmony/src/main/ets/RNOH/RNOHContext"
import { UITurboModuleContext } from '@rnoh/react-native-openharmony/src/main/ets/RNOH/TurboModule'
import { DisplayMetricsManager } from '@rnoh/react-native-openharmony/src/main/ets/RNOH/DisplayMetricsManager';
import { DevToolsController } from "@rnoh/react-native-openharmony/src/main/ets/RNOH/DevToolsController"
import { DevMenu } from "@rnoh/react-native-openharmony/src/main/ets/RNOH/DevMenu"
import { RNOHError, RNOHErrorEventEmitter } from "@rnoh/react-native-openharmony/src/main/ets/RNOH/RNOHError"
import AbilityConfiguration from '@ohos.app.ability.Configuration';
import { HttpClientProvider, DefaultHttpClientProvider } from '@rnoh/react-native-openharmony/src/main/ets/RNOH/HttpClientProvider';
import type { HttpClient } from "@rnoh/react-native-openharmony/src/main/ets/HttpClient/ts"
import { AbilityConstant, Want } from '@kit.AbilityKit';
import { WorkerThread } from "@rnoh/react-native-openharmony/src/main/ets/RNOH/WorkerThread"
import { SafeAreaInsetsProvider } from '@rnoh/react-native-openharmony/src/main/ets/RNOH/SafeAreaInsetsProvider';
import { bundleManager } from '@kit.AbilityKit';
import { EventEmitter } from '@rnoh/react-native-openharmony/src/main/ets/RNOH/EventEmitter';

/**
 * This interface allows providing dependencies in any order.
 * This is useful when some dependency is deprecated, made optional and later removed since such operation doesn't
 * create a breaking change.
 */
export interface XRNInstancesCoordinatorDependencies {
  fontSizeScale : number | undefined,
  logger: RNOHLogger,
  uiAbilityContext: common.UIAbilityContext,
  rnohWorkerScriptUrl?: string,

  /**
   * invoked when the React application doesn't want to handle the device back press
   */
  defaultBackPressHandler: () => void
}

export type BuildMode = "DEBUG" | "RELEASE"

export interface XRNInstancesCoordinatorOptions {
  launchURI?: string
  /** @deprecated: Use `defaultHttpClient` instead (latestRNOHVersion: 0.72.27) */
  httpClientProvider?: HttpClientProvider
  defaultHttpClient?: HttpClient
  /**
   * Set to `true` (in each UIAbility), if your app bundle provides multiple UIAbilities that use RNOH.
   */
  disableCleaningRNInstances?: boolean,
}

const RNOH_BANNER = '\n\n\n' +
  '██████╗ ███╗   ██╗ ██████╗ ██╗  ██╗' + '\n' +
  '██╔══██╗████╗  ██║██╔═══██╗██║  ██║' + '\n' +
  '██████╔╝██╔██╗ ██║██║   ██║███████║' + '\n' +
  '██╔══██╗██║╚██╗██║██║   ██║██╔══██║' + '\n' +
  '██║  ██║██║ ╚████║╚██████╔╝██║  ██║' + '\n' +
  '╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝ ╚═╝  ╚═╝' + '\n\n' +
  "█____ — MAIN" + "\n" +
  "_█___ — BACKGROUND" + "\n" +
  "__█__ — JS" + "\n" +
  "___█_ — WORKER" + "\n" +
  "____█ — CLEANUP" + "\n==================\n"

type AppState = "FOREGROUND" | "BACKGROUND"

function getMetadata(name: string): string {
  let bundleFlags = bundleManager.BundleFlag.GET_BUNDLE_INFO_WITH_METADATA |
  bundleManager.BundleFlag.GET_BUNDLE_INFO_WITH_APPLICATION;
  let metadataArray = bundleManager.getBundleInfoForSelfSync(bundleFlags).appInfo.metadataArray;
  let finalMetadata = '';
  metadataArray.forEach(moduleMetadata => {
    moduleMetadata.metadata.forEach(metadata => {
      if (metadata.name == name) {
        finalMetadata = metadata.value
        return;
      }
    });
  });
  return finalMetadata;
}

/**
 * Bootstraps React Native and forwards device events to RNInstances. This class is created for UIAbility's usage.
 * Use this class if RNAbility is too limiting for your use case, and adapting code to breaking changes is not a big deal in your project.
 */
export class XRNInstancesCoordinator {
  private static isInitialized = false

  static create(dependencies: XRNInstancesCoordinatorDependencies,
    options?: XRNInstancesCoordinatorOptions): XRNInstancesCoordinator {
    if (XRNInstancesCoordinator.isInitialized) {
      dependencies.logger.fatal(new RNOHError({
        whatHappened: "XRNInstancesCoordinator was already created",
        howCanItBeFixed: ["Change your code to call XRNInstancesCoordinator.create only once"]
      }))
    }
    XRNInstancesCoordinator.isInitialized = true
    dependencies.logger.info(RNOH_BANNER)
    const devToolsController = new DevToolsController(dependencies.logger);
    const napiBridge = new NapiBridge(dependencies.logger);
    const displayMetricsManager = new DisplayMetricsManager(dependencies.fontSizeScale ?? 1, dependencies.logger);
    const globalRNOHErrorEventEmitter: RNOHErrorEventEmitter = new EventEmitter();
    globalRNOHErrorEventEmitter.subscribe("NEW_ERROR", (err) => {
      dependencies.logger.error(err);
      devToolsController.setLastError(err);
      devToolsController.eventEmitter.emit("NEW_ERROR", err);
    })
    const envInfo =
      napiBridge.onInit(options?.disableCleaningRNInstances !== undefined ? !options.disableCleaningRNInstances : true,
        {
          handleError: (rnohError) => {
            globalRNOHErrorEventEmitter.emit("NEW_ERROR", rnohError)
          },
          getDisplayMetrics: () => displayMetricsManager.getDisplayMetrics(),
          getFontSizeScale: () => displayMetricsManager.getFontSizeScale(),
          getFoldStatus: () => displayMetricsManager.getFoldStatus(),
          getIsSplitScreenMode: () => displayMetricsManager.getIsSplitScreenMode(),
          getMetadata,
        });

    const devMenu = new DevMenu(devToolsController, dependencies.uiAbilityContext, dependencies.logger);
    napiBridge.initializeArkTSBridge({
      getDisplayMetrics: () => displayMetricsManager.getDisplayMetrics(),
      handleError: (err) => {
        devToolsController.setLastError(err)
        devToolsController.eventEmitter.emit("NEW_ERROR", err)
      },
      getFoldStatus: () => displayMetricsManager.getFoldStatus(),
      getIsSplitScreenMode: () => displayMetricsManager.getIsSplitScreenMode(),
      getFontSizeScale: () => displayMetricsManager.getFontSizeScale(),
      getMetadata
    });
    return new XRNInstancesCoordinator(napiBridge,
      dependencies.logger,
      displayMetricsManager,
      envInfo.isDebugModeEnabled,
      envInfo.envId,
      dependencies.uiAbilityContext,
      devToolsController,
      devMenu,
      dependencies.defaultBackPressHandler,
      globalRNOHErrorEventEmitter,
      dependencies.rnohWorkerScriptUrl,
      options);
  }

  private rawLogger: RNOHLogger;
  private logger: RNOHLogger;
  private xrnInstanceRegistry: XRNInstanceRegistry
  private rnohCoreContext: RNOHCoreContext;
  private napiBridge: NapiBridge;
  private displayMetricsManager: DisplayMetricsManager;
  private isDebugModeEnabled: boolean
  private uiAbilityContext: common.UIAbilityContext
  private devToolsController: DevToolsController
  private devMenu: DevMenu
  private options: XRNInstancesCoordinatorOptions | undefined
  private appState: AppState = "FOREGROUND"
  private defaultBackPressHandler: () => void
  private globalRNOHErrorEventEmitter: RNOHErrorEventEmitter
  private envId: number;

  private constructor(napiBridge: NapiBridge,
    logger: RNOHLogger,
    displayMetricsManager: DisplayMetricsManager,
    isDebugModeEnabled: boolean,
    envId: number,
    uiAbilityContext: common.UIAbilityContext,
    devToolsController: DevToolsController,
    devMenu: DevMenu,
    defaultBackPressHandler: () => void,
    globalRNOHErrorEventEmitter: RNOHErrorEventEmitter,
    rnohWorkerScriptUrl?: string | undefined,
    options?: XRNInstancesCoordinatorOptions) {
    this.envId = envId;
    this.logger = logger.clone("XRNInstancesCoordinator")
    this.rawLogger = logger
    this.napiBridge = napiBridge
    this.displayMetricsManager = displayMetricsManager;
    this.isDebugModeEnabled = isDebugModeEnabled;
    this.uiAbilityContext = uiAbilityContext;
    this.devToolsController = devToolsController;
    this.devMenu = devMenu;
    this.defaultBackPressHandler = defaultBackPressHandler;
    this.globalRNOHErrorEventEmitter = globalRNOHErrorEventEmitter;
    const httpClientProvider = options?.httpClientProvider ?? new DefaultHttpClientProvider()
    const workerThreadPromise = rnohWorkerScriptUrl !== undefined ? WorkerThread.create({
      scriptUrl: rnohWorkerScriptUrl,
      name: "RNOHWorker",
      logger: logger,
      onWorkerError: (rnohError) => {
        this.rnohCoreContext.reportRNOHError(rnohError);
      }
    }) : undefined
    this.xrnInstanceRegistry = new XRNInstanceRegistry(
      uiAbilityContext,
      this.envId,
      this.rawLogger,
      this.globalRNOHErrorEventEmitter,
      napiBridge,
      this.devToolsController,
      this.devMenu,
      (instance) => new UITurboModuleContext(RNOHContext.fromCoreContext(this.rnohCoreContext, instance)),
      httpClientProvider,
      options?.defaultHttpClient,
      this.uiAbilityContext.resourceManager,
      displayMetricsManager,
      workerThreadPromise
    )
    this.rnohCoreContext = new RNOHCoreContext({
      reactNativeVersion: "0.72.5",
      safeAreaInsetsProvider: new SafeAreaInsetsProvider(uiAbilityContext),
      logger: this.rawLogger,
      uiAbilityContext: this.uiAbilityContext,
      isDebugModeEnabled: this.isDebugModeEnabled,
      rnInstanceRegistry: this.xrnInstanceRegistry,
      displayMetricsProvider: () => this.displayMetricsManager.getDisplayMetrics(),
      uiAbilityStateProvider: () => this.appState,
      launchUri: this.options?.launchURI,
      defaultBackPressHandler: this.defaultBackPressHandler,
      devToolsController: this.devToolsController,
      devMenu: this.devMenu,
      rnohErrorEventEmitter: this.globalRNOHErrorEventEmitter
    });
  }

  public onDestroy() {
    const stopTracing = this.logger.clone("onDestroy").startTracing()
    this.xrnInstanceRegistry.forEach(instance => {
      instance.onDestroy()
    })
    stopTracing()
  }

  public getBuildMode(): BuildMode {
    return this.isDebugModeEnabled ? "DEBUG" : "RELEASE"
  }

  public getRNOHCoreContext() {
    return this.rnohCoreContext
  }

  public onForeground() {
    this.setAppState("FOREGROUND")
    this.xrnInstanceRegistry.forEach(instance => {
      instance.onForeground()
    })
  }

  private setAppState(appState: AppState) {
    this.appState = appState
  }

  public onBackground() {
    this.setAppState("BACKGROUND")
    this.xrnInstanceRegistry.forEach(instance => {
      instance.onBackground()
    })
  }

  public onWindowStageChange(windowStageEvent: window.WindowStageEventType) {
    this.xrnInstanceRegistry.forEach((rnInstance) => {
      rnInstance.onWindowStageChange(windowStageEvent)
    })
  }

  public onWindowSizeChange(windowSize: window.Size) {
    this.displayMetricsManager.updateWindowSize(windowSize);
    this.xrnInstanceRegistry.forEach((rnInstance) => {
      rnInstance.onWindowSizeChange(windowSize)
    })
  }

  public onConfigurationUpdate(systemConfiguration: AbilityConfiguration.Configuration) {
    this.displayMetricsManager?.updateDisplayMetrics()
    this.xrnInstanceRegistry?.forEach((rnInstance) => {
      rnInstance.onConfigurationUpdate(systemConfiguration)
    })
  }

  public onMemoryLevel(memoryLevel: number) {
    const MEMORY_LEVEL_NAMES = ["MEMORY_LEVEL_MODERATE", "MEMORY_LEVEL_LOW", "MEMORY_LEVEL_CRITICAL"]
    this.logger.debug("Received memory level event: " + MEMORY_LEVEL_NAMES[memoryLevel])
    this.napiBridge.onMemoryLevel(memoryLevel);
  }

  public onNewWant(want: Want, launchParam: AbilityConstant.LaunchParam) {
    this.xrnInstanceRegistry?.forEach((rnInstance) => {
      rnInstance.onNewWant(want.uri);
    })
  }
}