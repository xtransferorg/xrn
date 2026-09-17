/**
 * Copyright (c) 2024 Huawei Technologies Co., Ltd.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type common from '@ohos.app.ability.common'
import { RN_INSTANCE_MANAGER } from "../bundle/RNInstanceManager"
import window from '@ohos.window';
import { RNOHLogger } from "@rnoh/react-native-openharmony"
import { NapiBridge } from '@rnoh/react-native-openharmony';
import { XRNInstanceRegistry } from "./XRNInstanceRegistry"
import { RNOHContext, RNOHCoreContext, InternalRNOHCoreContext } from "@rnoh/react-native-openharmony/src/main/ets/RNOH/RNOHContext"
import { DisplayMetricsManager } from '@rnoh/react-native-openharmony';
import { InternalDevToolsController } from "@rnoh/react-native-openharmony/src/main/ets/RNOH/DevToolsController"
import { DevMenu, InternalDevMenu, NoopDevMenu } from "@rnoh/react-native-openharmony/src/main/ets/RNOH/DevMenu"
import { RNOHError, RNOHErrorEventEmitter } from "@rnoh/react-native-openharmony/src/main/ets/RNOH/RNOHError"
import AbilityConfiguration from '@ohos.app.ability.Configuration';
import { HttpClient, DefaultHttpClient } from "@rnoh/react-native-openharmony/src/main/ets/HttpClient"
import { AbilityConstant, Want } from '@kit.AbilityKit';
import { WorkerThread } from "@rnoh/react-native-openharmony/src/main/ets/RNOH/WorkerThread"
import { SafeAreaInsetsProvider } from '@rnoh/react-native-openharmony/src/main/ets/RNOH/SafeAreaInsetsProvider';
import { bundleManager } from '@kit.AbilityKit';
import { EventEmitter } from '@rnoh/react-native-openharmony/src/main/ets/RNOH/EventEmitter';
import { WorkerTaskRunner } from '@rnoh/react-native-openharmony/src/main/ets/RNOH/WorkerTaskRunner';
import { EtsUITurboModuleContext } from '@rnoh/react-native-openharmony/src/main/ets/RNOH/EtsRNOHContext';
import { RNSettingDialog } from '@rnoh/react-native-openharmony/src/main/ets/RNOH/RNSettingDialog';
import { JSEngineName } from '@rnoh/react-native-openharmony/src/main/ets/RNOH/types';
import { UIFpsMonitor, InternalUIFpsMonitor, NoopUIFpsMonitor } from "@rnoh/react-native-openharmony/src/main/ets/RNOH/UIFpsMonitor"
import { TAG_PRELOAD } from '../bundle/Preloadable';

/**
 * This interface allows providing dependencies in any order.
 * This is useful when some dependency is deprecated, made optional and later removed since such operation doesn't
 * create a breaking change.
 */
export interface XRNInstancesCoordinatorDependencies {
  /**
   * @deprecated
   */
  fontSizeScale?: number,
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
  // onGetPackagerClientConfig?: (buildMode: BuildMode) => JSPackagerClientConfig | undefined
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
  private isBoldTextEnabled:boolean | undefined = undefined;
  private static coordinatorByAbilityName: Map<string, XRNInstancesCoordinator> = new Map();

  static create(dependencies: XRNInstancesCoordinatorDependencies,
    options?: XRNInstancesCoordinatorOptions): XRNInstancesCoordinator {
    const abilityName = dependencies.uiAbilityContext.abilityInfo.name;
    const cachedCoordinator = XRNInstancesCoordinator.coordinatorByAbilityName.get(abilityName);
    if (cachedCoordinator) {
        console.error("Multiple XRNInstancesCoordinator instances cannot be created in a single ability.");
        return cachedCoordinator;
    }
    dependencies.logger.info(RNOH_BANNER)
    const onDestroyCallbacks: Function[] = []
    const devToolsController = new InternalDevToolsController(dependencies.logger);
    const napiBridge = new NapiBridge(dependencies.logger);
    const displayMetricsManager = new DisplayMetricsManager(dependencies.logger);
    displayMetricsManager.updateConfiguration(dependencies.uiAbilityContext.config);
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
          getMetadata,
        });

    let devMenu: DevMenu = new NoopDevMenu()
    // NOTE: only initialize DevMenu in debug mode
    if (envInfo.isDebugModeEnabled) {
      const internalDevMenu =
        new InternalDevMenu(devToolsController, new RNSettingDialog(), dependencies.uiAbilityContext,
          dependencies.logger);
      onDestroyCallbacks.push(() => {
        internalDevMenu.onDestroy()
      })
      devMenu = internalDevMenu;
    }

    // const jsPackagerClient = new JSPackagerClient(
    //   dependencies.logger,
    //   devToolsController,
    //   devMenu
    // )
    // const jsPackagerClientConfig =
    //   options?.onGetPackagerClientConfig?.(envInfo.isDebugModeEnabled ? "DEBUG" : "RELEASE")
    // if (jsPackagerClientConfig) {
    //   jsPackagerClient.connectToMetroMessages(jsPackagerClientConfig);
    // }
    const coordinator = new XRNInstancesCoordinator(napiBridge,
      dependencies.logger,
      displayMetricsManager,
      envInfo.isDebugModeEnabled,
      envInfo.jsEngineName,
      envInfo.envId,
      dependencies.uiAbilityContext,
      devToolsController,
      devMenu,
      // jsPackagerClient,
      dependencies.defaultBackPressHandler,
      globalRNOHErrorEventEmitter,
      dependencies.rnohWorkerScriptUrl,
      options,
      onDestroyCallbacks);

    XRNInstancesCoordinator.coordinatorByAbilityName.set(abilityName, coordinator);
    return coordinator;
  }

  private rawLogger: RNOHLogger;
  private logger: RNOHLogger;
  private xrnInstanceRegistry: XRNInstanceRegistry
  private rnohCoreContext: InternalRNOHCoreContext;
  private napiBridge: NapiBridge;
  private displayMetricsManager: DisplayMetricsManager;
  private isDebugModeEnabled: boolean
  private jsEngineName: JSEngineName
  private uiAbilityContext: common.UIAbilityContext
  private devToolsController: InternalDevToolsController
  private devMenu: DevMenu
  // private jsPackagerClient: JSPackagerClient
  private options: XRNInstancesCoordinatorOptions | undefined
  private appState: AppState = "FOREGROUND"
  private defaultBackPressHandler: () => void
  private globalRNOHErrorEventEmitter: RNOHErrorEventEmitter
  private envId: number;
  private workerTaskRunner: WorkerTaskRunner
  private onDestroyCallbacks: Function[]
  private timerId: number = 0
  private lastChangeTime: number = 0;
  private isWindowRectDrag: boolean = false
  private uiFpsMonitor: UIFpsMonitor;
  /**
   * Note: You may need to change this delay along with RNSurface's onMeasuredSize delay,
   * as both have an effect on window changes.
   */
  private readonly delayTime: number = 500;

  private constructor(napiBridge: NapiBridge,
    logger: RNOHLogger,
    displayMetricsManager: DisplayMetricsManager,
    isDebugModeEnabled: boolean,
    jsEngineName: JSEngineName,
    envId: number,
    uiAbilityContext: common.UIAbilityContext,
    devToolsController: InternalDevToolsController,
    devMenu: DevMenu,
    // jsPackagerClient: JSPackagerClient,
    defaultBackPressHandler: () => void,
    globalRNOHErrorEventEmitter: RNOHErrorEventEmitter,
    rnohWorkerScriptUrl?: string | undefined,
    options?: XRNInstancesCoordinatorOptions,
    onDestoryCallbacks?: Function[]) {
    this.envId = envId;
    this.logger = logger.clone("XRNInstancesCoordinator")
    this.rawLogger = logger
    this.napiBridge = napiBridge
    this.displayMetricsManager = displayMetricsManager;
    this.isDebugModeEnabled = isDebugModeEnabled;
    this.jsEngineName = jsEngineName;
    this.uiAbilityContext = uiAbilityContext;
    this.devToolsController = devToolsController;
    this.devMenu = devMenu;
    this.options = options;
    // this.jsPackagerClient = jsPackagerClient;
    this.defaultBackPressHandler = defaultBackPressHandler;
    this.globalRNOHErrorEventEmitter = globalRNOHErrorEventEmitter;
    const workerThreadPromise = rnohWorkerScriptUrl !== undefined ? WorkerThread.create ({
      scriptUrl: rnohWorkerScriptUrl,
      name: "RNOHWorker",
      logger: logger,
      onWorkerError: (rnohError) => {
        this.rnohCoreContext.reportRNOHError(rnohError);
      }
    }) : undefined
    this.workerTaskRunner = new WorkerTaskRunner(workerThreadPromise)

    this.xrnInstanceRegistry = new XRNInstanceRegistry(
      uiAbilityContext,
      this.envId,
      this.isDebugModeEnabled,
      this.jsEngineName,
      this.rawLogger,
      this.globalRNOHErrorEventEmitter,
      napiBridge,
      this.devToolsController,
      this.devMenu,
      (rnInstance) => new EtsUITurboModuleContext({
        rnohContext: RNOHContext.fromCoreContext(this.rnohCoreContext, rnInstance)
      }),
      options?.defaultHttpClient ?? new DefaultHttpClient(),
      this.uiAbilityContext.resourceManager,
      workerThreadPromise,
    )

    // Create PerfMonitorController after rnInstanceRegistry to capture startup markers
    this.uiFpsMonitor = this.isDebugModeEnabled
      ? new InternalUIFpsMonitor(this.rawLogger)
      : new NoopUIFpsMonitor();

    
    this.rnohCoreContext = new InternalRNOHCoreContext({
      reactNativeVersion: "0.77.1",
      safeAreaInsetsProvider: new SafeAreaInsetsProvider(uiAbilityContext),
      logger: this.rawLogger,
      uiAbilityContext: this.uiAbilityContext,
      isDebugModeEnabled: this.isDebugModeEnabled,
      jsEngineName: this.jsEngineName,
      rnInstanceRegistry: this.xrnInstanceRegistry,
      displayMetricsProvider: () => this.displayMetricsManager.getDisplayMetrics(),
      rnDisplayProvider: () => this.displayMetricsManager.getRNDisplay(),
      uiAbilityStateProvider: () => this.appState,
      launchUri: this.options?.launchURI,
      defaultBackPressHandler: this.defaultBackPressHandler,
      devToolsController: this.devToolsController,
      devMenu: this.devMenu,
      rnohErrorEventEmitter: this.globalRNOHErrorEventEmitter,
      erasedWorkerTaskRunner: this.workerTaskRunner,
      napiBridge: napiBridge,
      uiFpsMonitor: this.uiFpsMonitor
    });
    this.onDestroyCallbacks = onDestoryCallbacks ?? []
  }

  public onDestroy() {
    const stopTracing = this.logger.clone("onDestroy").startTracing()
    // this.jsPackagerClient.onDestroy()
    this.xrnInstanceRegistry.forEach(instance => {
      instance.onDestroy()
    })
    this.workerTaskRunner.onDestroy()
    this.rnohCoreContext.onDestroy()
    this.onDestroyCallbacks.forEach(cb => {
      cb()
    });
    const abilityName = this.uiAbilityContext.abilityInfo.name;
    XRNInstancesCoordinator.coordinatorByAbilityName.delete(abilityName);
    stopTracing()
  }

  public getBuildMode(): BuildMode {
    return this.isDebugModeEnabled ? "DEBUG" : "RELEASE"
  }

  public getRNOHCoreContext(): RNOHCoreContext {
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

  public onWindowRectChange(data: window.RectChangeOptions) {
    const isWindowRectDrag = data.reason === window.RectChangeReason.DRAG;
    if (this.isWindowRectDrag !== isWindowRectDrag) {
      this.xrnInstanceRegistry.forEach((rnInstance) => {
        rnInstance.onWindowReactChange(isWindowRectDrag);
      });
      this.isWindowRectDrag = isWindowRectDrag;
    }
  }

  public updateWindowRect(windowRect: window.Rect) {
    this.displayMetricsManager.updateWindowRect(windowRect);
    this.xrnInstanceRegistry.forEach((rnInstance) => {
      rnInstance.onWindowSizeChange({
        height: windowRect.height,
        width: windowRect.width
      })
    })
  }

  public onWindowSizeChange(windowSize: window.Size) {
    const currentTime = Date.now();
    if (currentTime - this.lastChangeTime > this.delayTime) {
      this.displayMetricsManager.updateWindowSize(windowSize);
      this.xrnInstanceRegistry.forEach((rnInstance) => {
        rnInstance.onWindowSizeChange(windowSize)
      })
      this.lastChangeTime = currentTime;
    } else {
      if (this.timerId) {
        clearTimeout(this.timerId)
      }
      this.timerId = setTimeout(() => {
        this.displayMetricsManager.updateWindowSize(windowSize);
        this.xrnInstanceRegistry.forEach((rnInstance) => {
          rnInstance.onWindowSizeChange(windowSize)
        })
        this.lastChangeTime = Date.now();
      }, this.delayTime)
      this.lastChangeTime = currentTime;
    }
  }

  public onConfigurationUpdate(systemConfiguration: AbilityConfiguration.Configuration) {
    this.displayMetricsManager?.updateConfiguration(systemConfiguration);

    const fontWeightScale = systemConfiguration.fontWeightScale;
    let isEmitBoldTextEvent = false;
    if (fontWeightScale !== undefined) {
      if (this.isBoldTextEnabled !== (fontWeightScale > 1)) {
        isEmitBoldTextEvent = true;
      }
      this.isBoldTextEnabled = fontWeightScale > 1;
    }
    this.xrnInstanceRegistry?.forEach((rnInstance): void => {
      rnInstance.onConfigurationUpdate(systemConfiguration);
      if (isEmitBoldTextEvent) {
        rnInstance.emitDeviceEvent('boldTextChanged', this.isBoldTextEnabled);
      }
    });
  }

  public onMemoryLevel(memoryLevel: number) {
    const MEMORY_LEVEL_NAMES = ["MEMORY_LEVEL_MODERATE", "MEMORY_LEVEL_LOW", "MEMORY_LEVEL_CRITICAL"]
    this.logger.debug("Received memory level event: " + MEMORY_LEVEL_NAMES[memoryLevel])
    this.napiBridge.onMemoryLevel(memoryLevel);
    // 低内存时回收预加载池中无引用的 RNInstance
    RN_INSTANCE_MANAGER?.gcOnMemoryLevel(memoryLevel).catch((err: object) => {
      console.log(`${TAG_PRELOAD}-XRNInstancesCoordinator.onMemoryLevel:memoryLeve=${memoryLevel}, err=${JSON.stringify(err)}`)
    })
  }

  public onNewWant(want: Want, launchParam: AbilityConstant.LaunchParam) {
    this.xrnInstanceRegistry?.forEach((rnInstance) => {
      rnInstance.onNewWant(want.uri);
    })
  }
}
