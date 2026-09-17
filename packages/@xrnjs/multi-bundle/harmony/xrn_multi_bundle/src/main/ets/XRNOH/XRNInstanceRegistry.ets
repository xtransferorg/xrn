/**
 * Copyright (c) 2024 Huawei Technologies Co., Ltd.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import font from '@ohos.font';
import type { RNInstance, RNInstanceImpl, RNInstanceOptions } from '@rnoh/react-native-openharmony';
import { XRNInstanceImpl } from './XRNInstance';
import type { NapiBridge } from '@rnoh/react-native-openharmony/src/main/ets/RNOH/NapiBridge';
import type { UITurboModuleContext } from '@rnoh/react-native-openharmony/src/main/ets/RNOH/TurboModule'
import type { RNOHLogger } from '@rnoh/react-native-openharmony/src/main/ets/RNOH/RNOHLogger';
import { DevToolsController, InternalDevToolsController } from '@rnoh/react-native-openharmony/src/main/ets/RNOH/DevToolsController';
import { HttpClient, DefaultHttpClient } from '@rnoh/react-native-openharmony/src/main/ets/HttpClient';
import { DisplayMetricsManager } from "@rnoh/react-native-openharmony/src/main/ets/RNOH/DisplayMetricsManager"
import resourceManager from '@ohos.resourceManager';
import { WorkerThread } from "@rnoh/react-native-openharmony/src/main/ets/RNOH/WorkerThread"
import common from '@ohos.app.ability.common'
import { RNOHCorePackage } from '@rnoh/react-native-openharmony/src/main/ets/RNOHCorePackage/Package'
import { RNOHError, RNOHErrorEventEmitter } from '@rnoh/react-native-openharmony/src/main/ets/RNOH/RNOHError';
import { JSEngineName } from '@rnoh/react-native-openharmony/src/main/ets/RNOH/types';
import { DevServerHelper } from '@rnoh/react-native-openharmony/src/main/ets/RNOH/DevServerHelper';
import { DevMenu } from '@rnoh/react-native-openharmony/src/main/ets/RNOH/DevMenu';

const DEFAULT_ASSETS_DEST: string = "assets/"; // assets destination path "assets/subpath/"

interface CreateWorkerRNInstanceAckPayload {
  rnInstanceId: number
}

interface DestroyWorkerRNInstanceAckPayload {
  rnInstanceId: number
}

export class XRNInstanceRegistry {
  private instanceMap: Map<number, XRNInstanceImpl> = new Map();
  private unregisterMessageListeners: (() => void)[] = []
  private uiAbilityContext: common.UIAbilityContext
  private envId: number
  private isDebugModeEnabled: boolean
  private jsEngineName: JSEngineName
  private logger: RNOHLogger
  private globalRNOHErrorEventEmitter: RNOHErrorEventEmitter;
  private napiBridge: NapiBridge
  private devToolsController: InternalDevToolsController
  private devMenu: DevMenu
  private createUITurboModuleContext: (rnInstance: RNInstanceImpl) => UITurboModuleContext
  private defaultHttpClient: HttpClient
  private resourceManager: resourceManager.ResourceManager
  private workerThreadPromise: Promise<WorkerThread> | undefined
  private instanceOptionsMap: Map<number, RNInstanceOptions> = new Map();
  private launchUri?: string;

  constructor(
    uiAbilityContext: common.UIAbilityContext,
    envId: number,
    isDebugModeEnabled: boolean,
    jsEngineName: JSEngineName,
    logger: RNOHLogger,
    rnohErrorEventEmitter: RNOHErrorEventEmitter,
    napiBridge: NapiBridge,
    devToolsController: InternalDevToolsController,
    devMenu: DevMenu,
    createUITurboModuleContext: (rnInstance: RNInstanceImpl) => UITurboModuleContext,
    defaultHttpClient: HttpClient,
    resourceManager: resourceManager.ResourceManager,
    workerThreadPromise: Promise<WorkerThread> | undefined,
    launchUri?: string,
  ) {
    this.uiAbilityContext = uiAbilityContext
    this.envId = envId
    this.isDebugModeEnabled = isDebugModeEnabled
    this.jsEngineName = jsEngineName
    this.logger = logger
    this.globalRNOHErrorEventEmitter = rnohErrorEventEmitter
    this.napiBridge = napiBridge
    this.devToolsController = devToolsController
    this.devMenu = devMenu
    this.createUITurboModuleContext = createUITurboModuleContext
    this.defaultHttpClient = defaultHttpClient
    this.resourceManager = resourceManager
    this.workerThreadPromise = workerThreadPromise
    this.launchUri = launchUri
  }

  private async createAndInitRNInstanceImpl(instanceId: number, options: RNInstanceOptions) : Promise<RNInstance> {
    const workerThread = await this.workerThreadPromise
    if (workerThread !== undefined) {
      await this.createRNInstanceEnvOnWorker(workerThread, instanceId, options)
    }
    const fontPathByFontFamily: Record<string, string> = {}
    for (const fontFamilyAndResource of Object.entries(options.fontResourceByFontFamily ?? {})) {
      const fontFamily = fontFamilyAndResource[0]
      const fontResource = fontFamilyAndResource[1]
      if (typeof fontResource == 'string') {
        fontPathByFontFamily[fontFamily] = fontResource
        font.registerFont({ familyName: fontFamily, familySrc: `file://${fontResource}` })
      } else {
        fontPathByFontFamily[fontFamily] = fontResource.params![0]
        font.registerFont({ familyName: fontFamily, familySrc: fontResource })
      }
    }
    const imageSourceByName: Record<string, string> = {};
    for (const imageNameAndSource of Object.entries(options.imageSourceByName ?? {})) {
      const imageName = imageNameAndSource[0];
      const imageSource = imageNameAndSource[1];
      imageSourceByName[imageName] = imageSource;
    }
    const rnInstance = new XRNInstanceImpl(
      this.envId,
      this.isDebugModeEnabled,
      this.jsEngineName,
      instanceId,
      options?.name,
      this.logger,
      this.globalRNOHErrorEventEmitter,
      this.napiBridge,
      options.disableConcurrentRoot,
      this.devToolsController,
      this.createUITurboModuleContext,
      workerThread,
      options.enableDebugger ?? false,
      options?.disablePartialSyncOfDescriptorRegistryInCAPI ?? false,
      options.assetsDest ?? DEFAULT_ASSETS_DEST,
      this.resourceManager,
      fontPathByFontFamily,
      imageSourceByName,
      options?.httpClient ?? this.defaultHttpClient,
      options?.caPathProvider ?? ((url: string) => ''),
      options.backPressHandler,
      options.jsvmInitOptions,
      options.hspModuleName,
    );
    rnInstance.setUIAbilityContext(this.uiAbilityContext);
    const packages = options.createRNPackages({})
    packages.unshift(new RNOHCorePackage({}));
    await rnInstance.initialize(packages);
    this.instanceMap.set(instanceId, rnInstance);
    return rnInstance;
  }

  public async reloadInstance(rnInstance: RNInstance): Promise<RNInstance> {
    const id = rnInstance.getId();

    const isFuseboxEnabled = this.napiBridge.getInspectorFlagIsFuseboxEnabled();
    if (!isFuseboxEnabled) {
      // Disable debugger to resume the JsVM & avoid thread locks while reloading
      DevServerHelper.disableDebugger();
    }

    if (rnInstance instanceof XRNInstanceImpl) {
      await rnInstance.onDestroy(false);
    }
    this.instanceMap.delete(id);
    await this.destroyRNInstanceWorker(id);
    const options = this.instanceOptionsMap.get(id);

    if (!options) {
      throw new RNOHError({
        whatHappened: "Attempted to reload RNInstance, but no RNInstanceOptions were found for the given ID.",
        howCanItBeFixed: []
      });
    }

    const newRNInstance = await this.createAndInitRNInstanceImpl(id, options);
    return newRNInstance;
  }

  public async createInstance(options: RNInstanceOptions): Promise<RNInstance> {
    const id = this.napiBridge.getNextRNInstanceId();
    if (options.enableDebugger) {
      this.napiBridge.createInspectorHostTarget(id,
        (type: string, payload: string) => {
          this.devToolsController.processInspectorMessage(type, payload)
        });
    }
    this.instanceOptionsMap.set(id, options);
    return this.createAndInitRNInstanceImpl(id, options);
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
        architecture: "C_API",
        assetsDest: options.assetsDest ?? DEFAULT_ASSETS_DEST,
        launchUri: this.launchUri,
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
      this.instanceOptionsMap.delete(id);
      this.destroyRNInstanceWorker(id);
      return true;
    }
    return false;
  }

  async destroyRNInstanceWorker(id: number) {
    if (this.workerThreadPromise !== undefined) {
      const worker = await this.workerThreadPromise;
      const ack =
        worker.waitForMessage("RNOH_DESTROY_WORKER_RN_INSTANCE_ACK",
          (payload: DestroyWorkerRNInstanceAckPayload) => payload.rnInstanceId === id)
      worker.postMessage("RNOH_DESTROY_WORKER_RN_INSTANCE", { rnInstanceId: id })
      await ack;
    }
  }

  public forEach(cb: (rnInstance: RNInstanceImpl) => void) {
    this.instanceMap.forEach(cb);
  }

  onDestroy() {
    this.unregisterMessageListeners.forEach(unregister => unregister())
  }
}
