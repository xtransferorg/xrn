import font from '@ohos.font';
import type { RNInstance, RNInstanceOptions, RNInstanceImpl } from '@rnoh/react-native-openharmony/src/main/ets/RNOH/RNInstance';
import type { NapiBridge } from '@rnoh/react-native-openharmony/src/main/ets/RNOH/NapiBridge';
import type { UITurboModuleContext } from '@rnoh/react-native-openharmony/src/main/ets/RNOH/TurboModule';
import type { RNOHLogger } from '@rnoh/react-native-openharmony/src/main/ets/RNOH/RNOHLogger';
import type { DevToolsController } from '@rnoh/react-native-openharmony/src/main/ets/RNOH/DevToolsController';
import { HttpClientProvider } from '@rnoh/react-native-openharmony/src/main/ets/RNOH/HttpClientProvider';
import { HttpClient } from '@rnoh/react-native-openharmony/src/main/ets/HttpClient/ts';
import { DisplayMetricsManager } from '@rnoh/react-native-openharmony/src/main/ets/RNOH/DisplayMetricsManager';
import resourceManager from '@ohos.resourceManager';
import { WorkerThread } from '@rnoh/react-native-openharmony/src/main/ets/RNOH/WorkerThread';
import common from '@ohos.app.ability.common';
import { RNOHCorePackage } from '@rnoh/react-native-openharmony/src/main/ets/RNOHCorePackage/Package';
import { RNOHErrorEventEmitter } from '@rnoh/react-native-openharmony/src/main/ets/RNOH/RNOHError';
import { XRNInstanceImpl } from './XRNInstance';
import type { DevMenu } from '@rnoh/react-native-openharmony/src/main/ets/RNOH/DevMenu';

const DEFAULT_ASSETS_DEST: string = "assets/"; // assets destination path "assets/subpath/"

interface CreateWorkerRNInstanceAckPayload {
  rnInstanceId: number
}

interface DestroyWorkerRNInstanceAckPayload {
  rnInstanceId: number
}

export class XRNInstanceRegistry {
  private instanceMap: Map<number, RNInstanceImpl> = new Map();
  private unregisterMessageListeners: (() => void)[] = []
  private uiAbilityContext: common.UIAbilityContext
  private envId: number
  private logger: RNOHLogger
  private globalRNOHErrorEventEmitter: RNOHErrorEventEmitter;
  private napiBridge: NapiBridge
  private devToolsController: DevToolsController
  private devMenu: DevMenu
  private createUITurboModuleContext: (rnInstance: RNInstanceImpl) => UITurboModuleContext
  private httpClientProvider: HttpClientProvider
  private defaultHttpClient: HttpClient | undefined
  private resourceManager: resourceManager.ResourceManager
  private displayMetricsManager: DisplayMetricsManager
  private workerThreadPromise: Promise<WorkerThread> | undefined

  constructor(
    uiAbilityContext: common.UIAbilityContext,
    envId: number,
    logger: RNOHLogger,
    rnohErrorEventEmitter: RNOHErrorEventEmitter,
    napiBridge: NapiBridge,
    devToolsController: DevToolsController,
    devMenu: DevMenu,
    createUITurboModuleContext: (rnInstance: RNInstanceImpl) => UITurboModuleContext,
    httpClientProvider: HttpClientProvider,
    defaultHttpClient: HttpClient | undefined, // TODO: remove "undefined" when HttpClientProvider is removed
    resourceManager: resourceManager.ResourceManager,
    displayMetricsManager: DisplayMetricsManager,
    workerThreadPromise: Promise<WorkerThread> | undefined,
  ) {
    this.uiAbilityContext = uiAbilityContext
    this.envId = envId
    this.logger = logger
    this.globalRNOHErrorEventEmitter = rnohErrorEventEmitter
    this.napiBridge = napiBridge
    this.devToolsController = devToolsController
    this.devMenu = devMenu
    this.createUITurboModuleContext = createUITurboModuleContext
    this.httpClientProvider = httpClientProvider
    this.defaultHttpClient = defaultHttpClient
    this.resourceManager = resourceManager
    this.displayMetricsManager = displayMetricsManager
    this.workerThreadPromise = workerThreadPromise
  }

  public async createInstance(options: RNInstanceOptions): Promise<RNInstance> {
    const id = this.napiBridge.getNextRNInstanceId();
    if (options.enableBackgroundExecutor) {
      this.logger.warn("'enableBackgroundExecutor' feature flag is deprecated");
    }
    if (options.enableCAPIArchitecture && !options.fontResourceByFontFamily) {
      this.logger.warn("No custom fonts registered");
    }
    const workerThread = await this.workerThreadPromise
    if (workerThread !== undefined) {
      await this.createRNInstanceEnvOnWorker(workerThread, id, options)
    }
    const fontPathByFontFamily: Record<string, string> = {}
    for (const entry of Object.entries(options.fontResourceByFontFamily ?? {})) {
      const fontFamily = entry[0]
      const fontResource = entry[1]
      if (typeof fontResource == 'string') {
        font.registerFont({ familyName: fontFamily, familySrc: `file://${fontResource}` })
        fontPathByFontFamily[fontFamily] = fontResource
      } else {
        fontPathByFontFamily[fontFamily] = fontResource.params![0]
        font.registerFont({ familyName: fontFamily, familySrc: fontResource })
      }
    }

    const rnInstance = new XRNInstanceImpl(
      this.envId,
      id,
      options?.name,
      this.logger,
      this.globalRNOHErrorEventEmitter,
      this.napiBridge,
      options.disableConcurrentRoot,
      this.devToolsController,
      this.createUITurboModuleContext,
      workerThread,
      options.enableDebugger ?? false,
      options.enableBackgroundExecutor ?? false,
      options.enableNDKTextMeasuring ?? false,
      options.enableImageLoader ?? false,
      options.enableCAPIArchitecture ?? false,
      options.assetsDest ?? DEFAULT_ASSETS_DEST,
      this.resourceManager,
      options.arkTsComponentNames ?? [],
      this.displayMetricsManager,
      fontPathByFontFamily,
      this.httpClientProvider,
      options?.httpClient ?? this.defaultHttpClient,
      options.backPressHandler,
    );
    const packages = options.createRNPackages({})
    packages.unshift(new RNOHCorePackage({}));
    await rnInstance.initialize(packages);
    this.instanceMap.set(id, rnInstance);
    return rnInstance;
  }

  private async createRNInstanceEnvOnWorker(workerThread: WorkerThread, rnInstanceId: number,
    options: RNInstanceOptions) {
    const logger = this.logger.clone(["RNInstanceRegistry", "createRNInstanceEnvOnWorker"])
    logger.info("waiting for worker's rnInstance environment")
    setTimeout(() => {
      workerThread.postMessage("RNOH_CREATE_WORKER_RN_INSTANCE", {
        rnInstanceId,
        rnInstanceName: options.name,
        uiAbilityContext: this.uiAbilityContext,
        architecture: options.enableCAPIArchitecture ? "C_API" : "ARK_TS",
        assetsDest: options.assetsDest ?? DEFAULT_ASSETS_DEST
      })
    }, 0)
    await workerThread.waitForMessage("RNOH_CREATE_WORKER_RN_INSTANCE_ACK",
      (payload: CreateWorkerRNInstanceAckPayload) => payload.rnInstanceId === rnInstanceId)
  }

  public getInstance(id: number): RNInstance {
    return this.instanceMap.get(id)!;
  }

  public async deleteInstance(id: number): Promise<boolean> {
    if (this.instanceMap.has(id)) {
      const instance = this.instanceMap.get(id)!;
      await instance.onDestroy();
      this.instanceMap.delete(id);
      if (this.workerThreadPromise !== undefined) {
        const worker = await this.workerThreadPromise;
        const ack =
          worker.waitForMessage("RNOH_DESTROY_WORKER_RN_INSTANCE_ACK",
            (payload: DestroyWorkerRNInstanceAckPayload) => payload.rnInstanceId === id)
        worker.postMessage("RNOH_DESTROY_WORKER_RN_INSTANCE", { rnInstanceId: id })
        await ack;
      }
      return true;
    }
    return false;
  }

  public forEach(cb: (rnInstance: RNInstanceImpl) => void) {
    this.instanceMap.forEach(cb);
  }

  onDestroy() {
    this.unregisterMessageListeners.forEach(unregister => unregister())
  }
}
