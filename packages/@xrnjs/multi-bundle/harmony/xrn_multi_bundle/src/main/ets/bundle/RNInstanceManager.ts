import { APP_RNOH_RNOHCoreContext,
  APP_RN_BUNDLE_STATE_MAP,
  APP_RN_RNINSTANCE_MANAGER,
  APP_RN_RNINSTANCE_MAP } from "../Constants";
import { BundleInfoManager } from "./BundleInfoManager";
import { EVENT_BUNDLE_RELOAD } from "../Constants";
import { BundleEventArgsByEventName } from "./BundleEvent";
import { EventEmitter } from "@rnoh/react-native-openharmony/src/main/ets/RNOH/EventEmitter";
import {
  LifecycleState,
  RNInstance,
  RNInstanceOptions } from "@rnoh/react-native-openharmony/src/main/ets/RNOH/RNInstance";
import { Tag } from "@rnoh/react-native-openharmony/src/main/ets/RNOH/DescriptorBase";
import { RNOHCoreContext } from "@rnoh/react-native-openharmony/src/main/ets/RNOH/RNOHContext";
import { BundleInfo } from "./BundleInfo";
import { JSBundleProvider } from "@rnoh/react-native-openharmony/src/main/ets/RNOH/JSBundleProvider";
import { List } from "@kit.ArkTS";

/**
 * Wrapper class for managing React Native instances.
 * Used for isolating and managing lifecycle of individual RN runtimes.
 */
export class RNInstanceWrapper {
  /**
   * The React Native instance.
   */
  readonly instance: RNInstance;
  /**
   * Provider responsible for supplying the JavaScript bundle.
   */
  readonly jsBundleProvider: JSBundleProvider;
  /**
   * Event emitter for handling bundle-related events.
   */
  readonly emitter: EventEmitter<BundleEventArgsByEventName>;
  /**
   * Name of the bundle associated with this instance.
   */
  readonly bundleName: string;

  /**
   * List of cleanup callbacks to be executed during instance teardown.
   */
  private readonly cleanUpCallbacks: (() => void)[] = []

  constructor(bundleName: string, instance: RNInstance, jsBundleProvider: JSBundleProvider) {
    this.bundleName = bundleName
    this.instance = instance
    this.jsBundleProvider = jsBundleProvider;
    this.emitter = new EventEmitter<BundleEventArgsByEventName>();
    this.init();
  }

  /**
   * Initializes internal subscriptions for the RN instance.
   * Subscribes to:
   * - Lifecycle event "JS_BUNDLE_EXECUTION_FINISH" to mark the bundle as ready.
   * - Custom "BUNDLE_RELOAD" event to trigger instance recreation.
   */
  private init() {
    this.cleanUpCallbacks.push(this.instance.subscribeToLifecycleEvents('JS_BUNDLE_EXECUTION_FINISH', (args) => {
      console.debug(`RNInstanceManager.subscribeToLifecycleEvents:url=${args.jsBundleUrl}, appKeys=${args.appKeys}, bundleName=${this.bundleName}`)
      RN_INSTANCE_MANAGER.updateBundleState(this.bundleName, BundleState.JS_READY)
    }))
    this.cleanUpCallbacks.push(this.emitter.subscribe(EVENT_BUNDLE_RELOAD, () => {
      RN_INSTANCE_MANAGER.reCreateRNInstance(this.bundleName)
    }))
  }

  /**
   * Executes all registered cleanup callbacks.
   * Typically called during teardown to release resources and unsubscribe listeners.
   */
  cleanUp() {
    this.cleanUpCallbacks.forEach((callback) => {
      callback();
    })
  }


  /**
   * Returns the number of SurfaceHandles currently bound to this RNInstance.
   * SurfaceHandles are used for managing RN views.
   *
   * @returns {number} Count of active SurfaceHandles
   */
  getSurfaceHandleCount(): number {
    const rnInstanceImp: any = this.instance;
    return rnInstanceImp.surfaceHandles.size;
  }

  /**
   * Returns a simple string description of the RNInstance.
   * Useful for logging or debugging purposes.
   *
   * @returns {string} A string like "RNInstance-{bundleName}-{instanceId}"
   */
  getRNInstanceSimpleDesc() {
    return `RNInstance-${this.bundleName}-${this.instance.getId()}`
  }
}

/**
 * Represents the lifecycle state of a Bundle.
 */
export enum BundleState {
  /**
   * RNInstance has not been created yet.
   */
  UNKNOWN,
  /**
   * RNInstance object has been created.
   */
  INIT,
  /**
   * runJSBundle has finished executing.
   */
  JS_READY,
  /**
   * Currently reloading the bundle.
   */
  RELOADING,
  /**
   * RNInstance has been destroyed.
   */
  DESTROY,
  /**
   * runJSBundle execution failed with an error.
   */
  RUN_JS_ERROR
}

/**
 * Describes the runtime data and state of a Bundle.
 */
export class BundleDes {
  /**
   * Name of the bundle
   */
  bundleName: string;
  /**
   * Current state of the bundle.
   */
  bundleState: BundleState;
  /**
   * ID of the associated RNInstance.
   */
  rnInstanceId: number;
  /**
   * Name of the RNInstance for easier identification.
   */
  rnInstanceName: string;
  /**
   * Lifecycle state of the RNInstance.
   */
  rnInstanceLifecycleState: LifecycleState;
  /**
   * JS bundle provider URL associated with this bundle.
   */
  jsBundleProviderUrl: string;
  /**
   * Number of active surface handles tied to this RNInstance.
   */
  surfaceHandleCount: number;
}

/**
 * Wrapper class for managing the state of a Bundle.
 */
export class BundleStateWrapper {
  /**
   * Bundle name.
   */
  readonly bundleName: string;
  /**
   * Current state of the bundle.
   */
  bundleState: BundleState;
  /**
   * The RNInstance object.
   * Only set when the bundle is in RELOADING state.
   */
  rnInstance: RNInstance | undefined
  /**
   * Maximum index of RNContainer for this bundle.
   * Starts from 1, increments with each new RNContainer creation.
   * Used to uniquely identify each RNContainer.
   */
  private rnContainerIndexMax = 0

  /**
   * List of currently active RNContainer indices.
   */
  readonly rnContainerIndexList = new List<number>()

  /**
   * Number of active React Native Views.
   */
  private rnViewCount = 0

  /**
   * Flag indicating whether this is the first load.
   */
  private isFirstLoad = true;

  constructor(bundleName: string, bundleState: BundleState) {
    this.bundleName = bundleName
    this.bundleState = bundleState
  }

  /**
   * Returns whether this is the first load of the bundle.
   */
  getIsFirstLoad() {
    return this.isFirstLoad;
  }

  /**
   * Sets the first load flag.
   */
  setFirstLoad(firstLoad: boolean) {
    this.isFirstLoad = firstLoad;
  }

  /**
   * Returns the current count of React Native Views.
   */
  getRNViewCount(): number {
    return this.rnViewCount;
  }

  /**
   * Increments the React Native View count by one.
   */
  addRNViewCount() {
    this.rnViewCount++;
  }

  /**
   * Decrements the React Native View count by one.
   */
  minusRNViewCount() {
    this.rnViewCount--;
  }

  /**
   * Resets the RNContainer index.
   * Should be called when recreating the RNInstance.
   */
  resetContainerIndex() {
    this.rnContainerIndexMax = 0;
  }

  /**
   * Returns the current maximum RNContainer index.
   */
  getContainerIndexMax(): number {
    return this.rnContainerIndexMax;
  }

  /**
   * Creates a new index for a RNContainer.
   * Increments the max index and returns it.
   */
  createIndexForRNContainer(): number {
    this.rnContainerIndexMax++;
    return this.rnContainerIndexMax;
  }

  /**
   * Adds a RNContainer index to the active list.
   * @param index - The index to add.
   * @returns Whether the index was successfully added.
   */
  addIndex(index: number): boolean {
    return this.rnContainerIndexList.add(index)
  }

  /**
   * Removes a RNContainer index from the active list.
   * @param index - The index to remove.
   * @returns Whether the index was successfully removed.
   */
  deleteIndex(index: number): boolean {
    return this.rnContainerIndexList.remove(index)
  }

  /**
   * Returns the last RNContainer index in the list.
   */
  getLastIndex() {
    return this.rnContainerIndexList.getLast()
  }

}

/**
 * Dependencies required by RNInstanceManager.
 */
export interface RNInstanceManagerOptions {
  /**
   * Retrieves options needed to create an RNInstance based on the provided BundleInfo.
   * @param bundleInfo - Information about the bundle.
   * @returns RNInstanceOptions for initializing the RNInstance.
   */
  getRNInstanceOptions: (bundleInfo: BundleInfo) => RNInstanceOptions;

  /**
   * Creates a JSBundleProvider for the given bundle.
   * @param bundleInfo - Information about the bundle.
   * @returns An instance of JSBundleProvider.
   */
  createJSBundleProvider: (bundleInfo: BundleInfo) => JSBundleProvider;

}

/**
 * Global instance of RNInstanceManager.
 */
export let RN_INSTANCE_MANAGER: RNInstanceManager

/**
 * Manager class for React Native instances.
 * Implements singleton pattern to manage multiple RNInstances.
 */
export class RNInstanceManager {

  private static TAG = "RNInstanceManager"

  /**
   * Configuration options and dependencies for RNInstanceManager.
   */
  private options: RNInstanceManagerOptions

  /**
   * Map from RNInstance ID to its wrapper object.
   */
  private id2InstanceMap: Map<number, RNInstanceWrapper> = new Map()
  /**
   * Map from bundle name to its RNInstance wrapper.
   */
  private bundle2InstanceMap: Map<string, RNInstanceWrapper> = new Map()

  /**
   * Map from bundle name to bundle state wrapper.
   */
  private bundle2StateMap: Map<string, BundleStateWrapper> = new Map()

  /**
   * Initializes the singleton RNInstanceManager with provided options.
   * @param options - Configuration and dependencies required.
   */
  static init(options: RNInstanceManagerOptions) {
    RN_INSTANCE_MANAGER = new RNInstanceManager(options)
  }

  private constructor(options: RNInstanceManagerOptions) {
    this.options = options
    this.init()
  }

  /**
   * Internal initialization: create initial bundle state wrappers for all bundles.
   */
  private init() {
    const bundleInfos = BundleInfoManager.INSTANCE.BUNDLE_INFOS
    for (let index = 0; index < bundleInfos.length; index++) {
      const info = bundleInfos[index];
      const bundleState = new BundleStateWrapper(info.bundleName, BundleState.UNKNOWN)
      this.bundle2StateMap.set(info.bundleName, bundleState)
    }
    AppStorage.setOrCreate<RNInstanceManager>(APP_RN_RNINSTANCE_MANAGER, this)
    AppStorage.setOrCreate<Map<string, RNInstanceWrapper>>(APP_RN_RNINSTANCE_MAP, undefined)
  }

  /**
   * Returns the options/dependencies used by this manager.
   */
  getOptions(): RNInstanceManagerOptions {
    return this.options
  }

  /**
   * Returns all RNInstanceWrapper objects currently managed.
   */
  getAllRNInstanceWrapper(): RNInstanceWrapper[] {
    return Array.from(this.id2InstanceMap.values())
  }

  /**
   * Retrieves the RNInstance by its internal ID.
   * @param id - RNInstance ID.
   * @returns The RNInstance or undefined if not found.
   */
  getRNInstanceById(id: number): RNInstance | undefined {
    return this.getRNInstanceWrapperById(id)?.instance
  }

  /**
   * Retrieves the JSBundleProvider by RNInstance ID.
   * @param id - RNInstance ID.
   * @returns The JSBundleProvider or undefined if not found.
   */
  getJSBundleProvider(id: number): JSBundleProvider | undefined {
    return this.getRNInstanceWrapperById(id)?.jsBundleProvider
  }

  /**
   * Retrieves the RNInstanceWrapper by RNInstance ID.
   * @param id - RNInstance ID.
   */
  getRNInstanceWrapperById(id: number): RNInstanceWrapper | undefined {
    return this.id2InstanceMap.get(id)
  }

  /**
   * Retrieves the RNInstance by bundle name.
   * @param bundleName - Bundle name string.
   */
  getRNInstanceByBundle(bundleName: string): RNInstance | undefined {
    return this.getRNInstanceWrapperByBundle(bundleName)?.instance
  }

  /**
   * Retrieves the JSBundleProvider by bundle name.
   * @param bundleName - Bundle name string.
   */
  getJSBundleProviderByBundle(bundleName: string): JSBundleProvider | undefined {
    return this.getRNInstanceWrapperByBundle(bundleName)?.jsBundleProvider
  }

  /**
   * Retrieves the RNInstanceWrapper by bundle name.
   * @param bundleName - Bundle name string.
   */
  getRNInstanceWrapperByBundle(bundleName: string): RNInstanceWrapper | undefined {
    return this.bundle2InstanceMap.get(bundleName)
  }

  /**
   * Creates a new RNInstance if one does not already exist for the given bundle.
   * @param bundleName - Bundle name.
   * @returns Promise resolving to the RNInstance.
   */
  async createInstanceIfNeed(bundleName: string): Promise<RNInstance> {
    let wrapper = this.getRNInstanceWrapperByBundle(bundleName)
    if (wrapper && wrapper.instance) {
      return wrapper.instance
    }
    const rnohCoreContext: RNOHCoreContext | undefined = AppStorage.get<RNOHCoreContext>(APP_RNOH_RNOHCoreContext)
    if (!rnohCoreContext) {
      throw new Error(`${RNInstanceManager.TAG}.getOrCreateInstance:rnohCoreContext=${rnohCoreContext}`)
    }
    const bundleInfo = BundleInfoManager.INSTANCE.getBundleInfo(bundleName)
    const rnInstance: RNInstance = await rnohCoreContext.createAndRegisterRNInstance(this.options.getRNInstanceOptions(bundleInfo!))
    const jsBundleProvider = this.options.createJSBundleProvider(bundleInfo)
    wrapper = new RNInstanceWrapper(bundleName, rnInstance, jsBundleProvider)
    this.id2InstanceMap.set(rnInstance.getId(), wrapper)
    this.bundle2InstanceMap.set(bundleName, wrapper)
    this.updateBundleState(bundleName, BundleState.INIT)
    AppStorage.setOrCreate<Map<string, RNInstanceWrapper>>(APP_RN_RNINSTANCE_MAP, this.bundle2InstanceMap)
    return wrapper.instance
  }

  /**
   * Recreates the RNInstance for the specified bundle.
   * Only destroys the current RNInstance and updates state.
   * New RNInstance creation should be managed externally (e.g. RNContainer components).
   * @param bundleName - Bundle name to reload.
   */
  async reCreateRNInstance(bundleName: string) {
    if (!BundleInfoManager.INSTANCE.isBundleRegistered(bundleName)) {
      return
    }
    let wrapper = this.getRNInstanceWrapperByBundle(bundleName)
    let bundleStateWrapper = this.getBundleStateWrapper(bundleName)
    bundleStateWrapper.resetContainerIndex()
    bundleStateWrapper.setFirstLoad(true);
    // If RNInstance has active SurfaceHandles (RN Views),
    // first destroy the RNApp to clear surfaceHandles which triggers RNInstance recreation.
    if (bundleStateWrapper?.getRNViewCount() > 0) {
      this.updateBundleState(bundleName, BundleState.RELOADING, wrapper?.instance);
      this.removeInstanceByBundle(bundleName)
    } else {
      this.removeInstanceByBundle(bundleName)
      if (wrapper?.instance) {
        // Only RNInstance exists but no SurfaceHandles, destroy and create anew.
        this.updateBundleState(bundleName, BundleState.RELOADING, wrapper?.instance);
        wrapper.instance.enableFeatureFlag("ENABLE_RN_INSTANCE_CLEAN_UP")
        const rnohCoreContext: RNOHCoreContext | undefined = AppStorage.get<RNOHCoreContext>(APP_RNOH_RNOHCoreContext)
        await rnohCoreContext?.destroyAndUnregisterRNInstance(wrapper.instance)
      }
      // Fallback: directly create a new RNInstance.
      this.createInstanceIfNeed(bundleName)
    }
  }

  /**
   * Internal method to remove all data related to a given bundleName.
   * Cleans up the RNInstance wrapper and updates internal maps.
   * @param bundleName - Bundle name to remove.
   * @returns True if removal succeeded, false if bundle not found.
   */
  private removeInstanceByBundle(bundleName: string): boolean {
    const instanceWrapper = this.bundle2InstanceMap.get(bundleName)
    if (!instanceWrapper) {
      return false
    }
    instanceWrapper.cleanUp()
    this.bundle2InstanceMap.delete(bundleName)
    this.id2InstanceMap.delete(instanceWrapper.instance.getId())
    AppStorage.setOrCreate<Map<string, RNInstanceWrapper>>(APP_RN_RNINSTANCE_MAP, this.bundle2InstanceMap)
    return true
  }

  /**
   * Returns the current state of a bundle by its name.
   * @param bundleName - Bundle name string.
   */
  getBundleState(bundleName: string): BundleState | undefined{
    return this.bundle2StateMap.get(bundleName)?.bundleState
  }

  /**
   * Returns the BundleStateWrapper instance for a bundle.
   * @param bundleName - Bundle name string.
   */
  getBundleStateWrapper(bundleName: string): BundleStateWrapper | undefined {
    return this.bundle2StateMap.get(bundleName)
  }

  /**
   * Retrieves a runtime descriptor for the specified bundle.
   * Includes bundle info, RNInstance info, lifecycle, and surface handles.
   * @param bundleName - Bundle name string.
   * @returns A BundleDes object describing the bundle runtime status.
   */
  getBundleDesc(bundleName: string): BundleDes {
    const rnInstanceWrapper = this.getRNInstanceWrapperByBundle(bundleName)
    const bundleState = this.getBundleState(bundleName)
    return {
      bundleName: bundleName,
      bundleState: bundleState,
      rnInstanceId: rnInstanceWrapper?.instance?.getId(),
      rnInstanceName: rnInstanceWrapper?.instance?.getName(),
      rnInstanceLifecycleState: rnInstanceWrapper?.instance?.getLifecycleState(),
      jsBundleProviderUrl: rnInstanceWrapper?.jsBundleProvider?.getURL(),
      surfaceHandleCount: rnInstanceWrapper?.getSurfaceHandleCount(),
    }
  }



  /**
   * Updates the bundle's state and optionally associates the RNInstance.
   * @param bundleName - Bundle name string.
   * @param bundleState - New state to set.
   * @param rnInstance - Optional RNInstance to associate (only set when RELOADING).
   */
  updateBundleState(bundleName: string, bundleState: BundleState, rnInstance: RNInstance | undefined = undefined) {
    const wrapper: BundleStateWrapper | undefined = this.bundle2StateMap.get(bundleName)
    if (!wrapper) {
      throw new Error(`${RNInstanceManager.TAG}.updateBundleState:invalid bundleName=${bundleName}`)
    }
    wrapper.bundleState = bundleState
    //RELOADING 状态
    if (bundleState === BundleState.RELOADING) {
      wrapper.rnInstance = rnInstance
    } else {
      wrapper.rnInstance = undefined
    }
    AppStorage.setOrCreate<Map<string, BundleStateWrapper>>(APP_RN_BUNDLE_STATE_MAP, this.bundle2StateMap)
  }

  /**
   * Preloads multiple bundles by creating their RNInstances if needed.
   * @param bundles - Array of bundle names to preload.
   */
  async preLoadBundle(bundles: string[]) {
    for (let index = 0; index < bundles.length; index++) {
      const bundleName = bundles[index];
      await this.createInstanceIfNeed(bundleName)
    }
  }


}