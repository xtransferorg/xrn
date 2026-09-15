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
import hidebug from '@ohos.hidebug';
import { CommonInstancePool } from "./CommonInstancePool";
import { PreloadQueue } from "./PreloadQueue";
import { isSplitMode } from "./BundleHelper";
import { RNPackage } from "@rnoh/react-native-openharmony/ts";
import { XRNInstanceImpl } from "../../../../ts";
import { TAG_PRELOAD } from "./Preloadable";

/**
 * RNInstance 封装类
 */
export class RNInstanceWrapper {
  /**
   * RNInstance
   */
  readonly instance: RNInstance;
  /**
   * JS Provider
   */
  readonly jsBundleProvider: JSBundleProvider;
  /**
   * 处理事件
   */
  readonly emitter: EventEmitter<BundleEventArgsByEventName>;
  /**
   * bundle name
   */
  readonly bundleName: string;

  private readonly cleanUpCallbacks: (() => void)[] = []

  constructor(bundleName: string, instance: RNInstance, jsBundleProvider: JSBundleProvider) {
    this.bundleName = bundleName
    this.instance = instance
    this.jsBundleProvider = jsBundleProvider;
    this.emitter = new EventEmitter<BundleEventArgsByEventName>();
    this.init();
  }

  private init() {
    this.cleanUpCallbacks.push(this.instance.subscribeToLifecycleEvents('JS_BUNDLE_EXECUTION_FINISH', (args) => {
      console.debug(`RNInstanceManager.subscribeToLifecycleEvents:url=${args.jsBundleUrl}, appKeys=${args.appKeys}, bundleName=${this.bundleName}`)
      RN_INSTANCE_MANAGER.updateBundleState(this.bundleName, BundleState.JS_READY)
      RN_INSTANCE_MANAGER.refillCommonPoolIfNeeded()
    }))
    this.cleanUpCallbacks.push(this.emitter.subscribe(EVENT_BUNDLE_RELOAD, () => {
      RN_INSTANCE_MANAGER.reCreateRNInstance(this.bundleName)
    }))
  }

  cleanUp() {
    this.cleanUpCallbacks.forEach((callback) => {
      callback();
    })
  }


  /**
   * 获取当前 RNInstance 绑定的 SurfaceHandle（用于处理 RN 试图） 数量
   * @returns
   */
  getSurfaceHandleCount(): number {
    const rnInstanceImp: any = this.instance;
    return rnInstanceImp.surfaceHandleByAppKey.size;
  }

  /**
   * 获取 RNInstance 名字
   * 方便辨认
   * @returns
   */
  getRNInstanceSimpleDesc() {
    return `RNInstance-${this.bundleName}-${this.instance.getId()}`
  }
}

/**
 * Bundle 状态
 */
export enum BundleState {
  /**
   * RNInstance 未创建
   */
  UNKNOWN,
  /**
   * RNInstance 对象已创建
   */
  INIT,
  /**
   * 仅 common bundle 已加载，实例存于 common 预备池（由 CommonInstancePool 管理）。
   */
  COMMON_JS_READY,
  /**
   * runJSBundle 已结束
   */
  JS_READY,
  /**
   * 正在 RELOAD
   */
  RELOADING,
  /**
   * 正在 Release
   */
  RELEASING,
  /**
   * 已销毁
   */
  DESTROY,
  /**
   * common bundle 加载报错（拆包模式下 common 阶段失败）
   */
  RUN_COMMON_JS_ERROR,
  /**
   * biz bundle 加载报错（common 成功，biz 阶段失败）
   */
  RUN_JS_ERROR
}

/**
 * Bundle 数据描述
 */
export class BundleDes {
  bundleName: string;
  bundleState: BundleState;
  rnInstanceId: number;
  rnInstanceName: string;
  rnInstanceLifecycleState: LifecycleState;
  jsBundleProviderUrl: string;
  surfaceHandleCount: number;
}

/**
 * Bundle 状态封装类
 */
export class BundleStateWrapper {
  /**
   * bundle 名
   */
  readonly bundleName: string;
  /**
   * bundle 状态
   */
  bundleState: BundleState;
  /**
   * RNInstance 对象
   * 只有在 RELOADING 的时候，才有值
   */
  rnInstance: RNInstance | undefined
  /**
   * 当前Bundle的RNContainer索引最大值，从1开始，用于标识每个RNContainer;
   * 每创建一个新的 RNContainer，+1；
   */
  private rnContainerIndexMax = 0

  /**
   * 存储当前运行的RNContainer索引
   */
  readonly rnContainerIndexList = new List<number>()

  /**
   * RN View 数量
   */
  private rnViewCount = 0

  /**
   * 最近一次绑定时间戳（rnViewCount 从 0 变为 1 时记录）
   */
  private lastBindTime: number = 0

  /**
   * 最近一次解绑时间戳（rnViewCount 从 1 变为 0 时记录，LRU 依据）
   */
  private lastUnbindTime: number = 0

  /**
   * 是否第一次加载
   */
  private isFirstLoad = true;

  constructor(bundleName: string, bundleState: BundleState) {
    this.bundleName = bundleName
    this.bundleState = bundleState
  }

  getIsFirstLoad() {
    return this.isFirstLoad;
  }

  setFirstLoad(firstLoad: boolean) {
    this.isFirstLoad = firstLoad;
  }

  getRNViewCount(): number {
    return this.rnViewCount;
  }

  addRNViewCount() {
    if (this.rnViewCount === 0) {
      this.lastBindTime = Date.now()
    }
    this.rnViewCount++;
  }

  minusRNViewCount() {
    this.rnViewCount--;
    if (this.rnViewCount === 0) {
      this.lastUnbindTime = Date.now()
    }
  }

  getLastBindTime(): number {
    return this.lastBindTime;
  }

  getLastUnbindTime(): number {
    return this.lastUnbindTime;
  }

  /**
   * 重置 Index
   * reCreateRNInstance 时需要重置
   */
  resetContainerIndex() {
    this.rnContainerIndexMax = 0;
  }

  /**
   * 获取当前最大Index
   * @returns
   */
  getContainerIndexMax(): number {
    return this.rnContainerIndexMax;
  }

  /**
   * 创建 RNContainer 索引
   * @returns
   */
  createIndexForRNContainer(): number {
    this.rnContainerIndexMax++;
    return this.rnContainerIndexMax;
  }

  /**
   * 添加索引
   * @param index
   * @returns
   */
  addIndex(index: number): boolean {
    return this.rnContainerIndexList.add(index)
  }

  /**
   * 删除索引
   * @param index
   * @returns
   */
  deleteIndex(index: number): boolean {
    return this.rnContainerIndexList.remove(index)
  }

  /**
   * 获取当前最后索引
   * @returns
   */
  getLastIndex() {
    return this.rnContainerIndexList.getLast()
  }

}

export interface SplitBundleOption {
  getCommonBundleName: () => string;
  isSplitMode: (bundleInfo: BundleInfo) => boolean
}

export interface RNInstanceExtraOptions extends RNInstanceOptions  {

  /**
   * bundleName
   * common 预加载的时候，设置为 “xt-app-common”，加载业务 Bundle 时，设置为正式的 bundleName
   */
  bundleName?: string;
  /**
   * 是否延迟初始化
   * common 预加载场景
   */
  isLazyInit?: boolean;

  /**
   * 内置 RNPackage
   */
  buildInPackages?: RNPackage[];
}

/**
 * bundle 加载生命周期追踪接口。
 * 由 xrn-performance 的 LcpTimingTracker 实现并通过 RN_INSTANCE_MANAGER.registerBundleLoadTracker 注入。
 * 统一在 RNInstanceManager 持有，供 XRNInstanceImpl（bundle 加载打点）
 * 和 reCreateRNInstance（后台重建时抑制 LCP 上报）共同使用，无需各自维护独立的注册机制。
 */
export interface BundleLoadTracker {
  /** common bundle 开始加载 */
  markCommonBundleLoadStart(bundleName: string): void;
  /** common bundle 加载完成 */
  markCommonBundleLoadEnd(bundleName: string): void;
  /** biz bundle 实际开始加载（common 已就绪，super.runJSBundle 之前） */
  markBizBundleLoadStart(bundleName: string): void;
  /** bundle 因退出后台而触发 reCreateRNInstance，标记本次及下一轮加载周期均不上报 LCP */
  handleAppDidEnterBackground(bundleName: string): void;
}

/**
 * RNInstanceManager 依赖项
 */
export interface RNInstanceManagerOptions {
  /**
   * 获取 RNInstanceO 依赖数据
   * @param bundleInfo
   * @returns
   */
  getRNInstanceOptions: (bundleInfo: BundleInfo) => RNInstanceOptions;

  /**
   * 创建 JSBundleProvider
   * @param bundleInfo
   * @returns
   */
  createJSBundleProvider: (bundleInfo: BundleInfo) => JSBundleProvider;

  /**
   * 获取拆包相关数据
   * @param bundleInfo
   * @returns
   */
  getSplitBundleOptions: () => SplitBundleOption;

  /**
   * 是否处于内存压力状态
   * @returns 
   */
  isMemoryPressured: () => boolean;

}

/**
 * 全局数据
 */
export let RN_INSTANCE_MANAGER: RNInstanceManager

/**
 * RNInstance 管理类
 * 单例
 */
export class RNInstanceManager {

  private static TAG = "RNInstanceManager"

  /**
   * RNInstanceManager 依赖数据
   */
  private options: RNInstanceManagerOptions

  /**
   * RNInstance.getId -> RNInstanceWrapper 的映射关系
   */
  private id2InstanceMap: Map<number, RNInstanceWrapper> = new Map()
  /**
   * bundleName -> RNInstanceWrapper 的映射关系
   */
  private bundle2InstanceMap: Map<string, RNInstanceWrapper> = new Map()

  /**
   * bundleName -> BundleStateWrapper 的映射关系
   */
  private bundle2StateMap: Map<string, BundleStateWrapper> = new Map()

  /** common 预备池：单个仅加载了 common bundle 的 RNInstance */
  private commonPool = new CommonInstancePool()

  /** 预加载优先级队列：common 高优先 + biz 普通，串行执行 */
  private preloadQueue: PreloadQueue

  /**
   * bundle 加载生命周期追踪器，由 xrn-performance 层注册。
   * 统一持有，供 XRNInstanceImpl（bundle 加载打点）和 reCreateRNInstance（后台重建抑制）共享使用，
   * 以解耦 @xrnjs/multi-bundle 对 xrn-performance 的直接依赖。
   */
  private bundleLoadTracker?: BundleLoadTracker

  static init(options: RNInstanceManagerOptions) {
    RN_INSTANCE_MANAGER = new RNInstanceManager(options)
  }

  private constructor(options: RNInstanceManagerOptions) {
    this.options = options
    this.init()
  }

  private init() {
    const bundleInfos = BundleInfoManager.INSTANCE.BUNDLE_INFOS
    for (let index = 0; index < bundleInfos.length; index++) {
      const info = bundleInfos[index];
      const bundleState = new BundleStateWrapper(info.bundleName, BundleState.UNKNOWN)
      this.bundle2StateMap.set(info.bundleName, bundleState)
    }
    this.preloadQueue = new PreloadQueue(
      // executeCommon：填充 common 预备池
      () => this.commonPool.fillIfNeeded(() => this.createCommonInstance()),
      // executeBiz：执行业务 bundle 预加载
      (bundleName) => this._doPreloadFullJSBundle(bundleName),
      // shouldSkipCommon：pool 已有实例或正在填充时跳过
      () => this.commonPool.hasInstance || this.commonPool.isLoading,
      // shouldSkipBiz：已有对应 RNInstance（state ≠ UNKNOWN）时跳过
      (bundleName) => {
        const instance = this.getRNInstanceByBundle(bundleName)
        return !!instance
      },
    )
    AppStorage.setOrCreate<RNInstanceManager>(APP_RN_RNINSTANCE_MANAGER, this)
    AppStorage.setOrCreate<Map<string, RNInstanceWrapper>>(APP_RN_RNINSTANCE_MAP, undefined)
  }

  /**
   * 注册 bundle 加载生命周期追踪器。
   * 由 xrn-performance 层在初始化时调用，将 LcpTimingTracker 注入。
   * XRNInstanceImpl 和 reCreateRNInstance 均通过 getBundleLoadTracker() 共享同一实例。
   */
  registerBundleLoadTracker(tracker: BundleLoadTracker): void {
    this.bundleLoadTracker = tracker;
  }

  /**
   * 获取已注册的 bundle 加载追踪器，供 XRNInstanceImpl 在 bundle 加载时使用。
   */
  getBundleLoadTracker(): BundleLoadTracker | undefined {
    return this.bundleLoadTracker;
  }

  /**
   * 获取 RNInstanceManagerOptions
   * @returns
   */
  getOptions(): RNInstanceManagerOptions {
    return this.options
  }

  /**
   * 获取所有 RNInstanceWrapper
   * @returns
   */
  getAllRNInstanceWrapper(): RNInstanceWrapper[] {
    return Array.from(this.id2InstanceMap.values())
  }

  /**
   * 根据 RNInstance id 获取 RNInstance
   * @param id
   * @returns
   */
  getRNInstanceById(id: number): RNInstance | undefined {
    return this.getRNInstanceWrapperById(id)?.instance
  }

  /**
   * 根据 RNInstance id 获取 JSBundleProvider
   * @param id
   * @returns
   */
  getJSBundleProvider(id: number): JSBundleProvider | undefined {
    return this.getRNInstanceWrapperById(id)?.jsBundleProvider
  }

  /**
   * 根据 RNInstance id 获取 RNInstanceWrapper
   * @param id
   * @returns
   */
  getRNInstanceWrapperById(id: number): RNInstanceWrapper | undefined {
    return this.id2InstanceMap.get(id)
  }

  /**
   * 根据 bundleName 获取 RNInstance
   * @param bundleName
   * @returns
   */
  getRNInstanceByBundle(bundleName: string): RNInstance | undefined {
    return this.getRNInstanceWrapperByBundle(bundleName)?.instance
  }

  /**
   * 根据 bundleName 获取 JSBundleProvider
   * @param bundleName
   * @returns
   */
  getJSBundleProviderByBundle(bundleName: string): JSBundleProvider | undefined {
    return this.getRNInstanceWrapperByBundle(bundleName)?.jsBundleProvider
  }

  /**
   * 根据 bundleName 获取 RNInstanceWrapper
   * @param bundleName
   * @returns
   */
  getRNInstanceWrapperByBundle(bundleName: string): RNInstanceWrapper | undefined {
    return this.bundle2InstanceMap.get(bundleName)
  }

  registerBundleInfo(info: BundleInfo) {
    if (!info || !info.bundleName) {
      return
    }
    if (this.bundle2StateMap.has(info.bundleName)) {
      return
    }
    const bundleState = new BundleStateWrapper(info.bundleName, BundleState.UNKNOWN)
    this.bundle2StateMap.set(info.bundleName, bundleState)
  }

  /**
   * 创建 RNInstance
   * @param bundleName
   * @returns
   */
  async createInstanceIfNeed(bundleName: string): Promise<RNInstance> {
    let wrapper = this.getRNInstanceWrapperByBundle(bundleName)
    if (wrapper && wrapper.instance) {
      return wrapper.instance
    }
    const rnohCoreContext: RNOHCoreContext | undefined = AppStorage.get<RNOHCoreContext>(APP_RNOH_RNOHCoreContext)
    if (!rnohCoreContext) {
      throw new Error(`${RNInstanceManager.TAG}.createInstanceIfNeed: rnohCoreContext not ready`)
    }
    const bundleInfo = BundleInfoManager.INSTANCE.getBundleInfo(bundleName)!

    // 仅当该 bundle 需要加载 common（开启了拆包）时才尝试复用 pool
    const needCommon = isSplitMode(bundleName)
    const pooled = needCommon ? await this.commonPool.takeOrWait() : null
    console.log(`${TAG_PRELOAD}-${RNInstanceManager.TAG}.createInstanceIfNeed: bundleName=${bundleName}, needCommon=${needCommon}, pooled=${pooled}`)
    let rnInstance: RNInstance = null
    if (pooled) {
      rnInstance = pooled
      this.setBundleInfoOnInstance(rnInstance, bundleInfo)
    } else {
      rnInstance = await rnohCoreContext.createAndRegisterRNInstance(this.options.getRNInstanceOptions(bundleInfo))
      
    }
    const jsBundleProvider = this.options.createJSBundleProvider(bundleInfo)
    wrapper = new RNInstanceWrapper(bundleName, rnInstance, jsBundleProvider)
    this.id2InstanceMap.set(rnInstance.getId(), wrapper)
    this.bundle2InstanceMap.set(bundleName, wrapper)
    this.updateBundleState(bundleName, BundleState.INIT)
    AppStorage.setOrCreate<Map<string, RNInstanceWrapper>>(APP_RN_RNINSTANCE_MAP, this.bundle2InstanceMap)
    return wrapper.instance
  }

  /**
   * 重新创建 RNInstance，本方法只销毁RNInstance并记录当前状态；
   * 需配合 RNContainer 组件，创建新的 RNInstance；
   * @param bundleName
   */
  async reCreateRNInstance(bundleName: string) {
    if (!BundleInfoManager.INSTANCE.isBundleRegistered(bundleName)) {
      return
    }
    // 通知 LCP 追踪器：该 bundle 因退出后台而重建，本次及下一次加载周期均不上报 LCP 数据
    this.bundleLoadTracker?.handleAppDidEnterBackground(bundleName);
    let wrapper = this.getRNInstanceWrapperByBundle(bundleName)
    let bundleStateWrapper = this.getBundleStateWrapper(bundleName)
    bundleStateWrapper.resetContainerIndex()
    bundleStateWrapper.setFirstLoad(true);
    //RNInstance 持有 SurfaceHandle时，先销毁 RNApp，导致 RNInstance 内部 surfaceHandles 清空时，触发销毁和重新创建 RNInstance
    if (bundleStateWrapper?.getRNViewCount() > 0) {
      this.updateBundleState(bundleName, BundleState.RELOADING, wrapper?.instance);
      this.removeInstanceByBundle(bundleName)
    } else {
      this.removeInstanceByBundle(bundleName)
      if (wrapper?.instance) {
        //只有 RNInstance，但是没有 SurfaceHandle，直接销毁和创建
        this.updateBundleState(bundleName, BundleState.RELOADING, wrapper?.instance);
        wrapper.instance.enableFeatureFlag("ENABLE_RN_INSTANCE_CLEAN_UP")
        const rnohCoreContext: RNOHCoreContext | undefined = AppStorage.get<RNOHCoreContext>(APP_RNOH_RNOHCoreContext)
        await rnohCoreContext?.destroyAndUnregisterRNInstance(wrapper.instance)
      }
      //兜底处理：直接创建RNINstance
      this.createInstanceIfNeed(bundleName)
    }
  }

  async releaseRNInstance(bundleName: string, isForce: boolean = false) {
    if (!BundleInfoManager.INSTANCE.isBundleRegistered(bundleName)) {
      return
    }
    let wrapper = this.getRNInstanceWrapperByBundle(bundleName)
    let bundleStateWrapper = this.getBundleStateWrapper(bundleName)
    bundleStateWrapper.resetContainerIndex()
    bundleStateWrapper.setFirstLoad(true);
    //RNInstance 持有 SurfaceHandle时，先销毁 RNApp，导致 RNInstance 内部 surfaceHandles 清空时，触发销毁创建 RNInstance
    if (bundleStateWrapper?.getRNViewCount() > 0 && !isForce) {
      this.updateBundleState(bundleName, BundleState.RELEASING, wrapper?.instance);
      this.removeInstanceByBundle(bundleName)
    } else {
      this.removeInstanceByBundle(bundleName)
      if (wrapper?.instance) {
        //只有 RNInstance，但是没有 SurfaceHandle，直接销毁和创建
        this.updateBundleState(bundleName, BundleState.DESTROY, wrapper?.instance);
        wrapper.instance.enableFeatureFlag("ENABLE_RN_INSTANCE_CLEAN_UP")
        const rnohCoreContext: RNOHCoreContext | undefined = AppStorage.get<RNOHCoreContext>(APP_RNOH_RNOHCoreContext)
        await rnohCoreContext?.destroyAndUnregisterRNInstance(wrapper.instance)
      }
    }
  }

  /**
   * 内部删除 bundleName 相关的数据
   * @param bundleName
   * @returns
   */
  public removeInstanceByBundle(bundleName: string): boolean {
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
   * 获取 Bundle State
   * @param bundleName
   * @returns
   */
  getBundleState(bundleName: string): BundleState | undefined{
    return this.bundle2StateMap.get(bundleName)?.bundleState
  }

  /**
   * 获取 BundleStateWrapper
   * @param bundleName
   * @returns
   */
  getBundleStateWrapper(bundleName: string): BundleStateWrapper | undefined {
    return this.bundle2StateMap.get(bundleName)
  }

  /**
   * 获取 Bundle 当前的数据描述
   * @param bundleName
   * @returns
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
   * 更新 Bundle State
   * @param bundleName
   * @param bundleState
   */
  updateBundleState(bundleName: string, bundleState: BundleState, rnInstance: RNInstance | undefined = undefined) {
    const wrapper: BundleStateWrapper | undefined = this.bundle2StateMap.get(bundleName)
    if (!wrapper) {
      throw new Error(`${RNInstanceManager.TAG}.updateBundleState:invalid bundleName=${bundleName}`)
    }
    wrapper.bundleState = bundleState
    //RELOADING 状态 | RELEASE
    if (bundleState === BundleState.RELOADING || bundleState === BundleState.RELEASING) {
      wrapper.rnInstance = rnInstance
    } else {
      wrapper.rnInstance = undefined
    }
    AppStorage.setOrCreate<Map<string, BundleStateWrapper>>(APP_RN_BUNDLE_STATE_MAP, this.bundle2StateMap)
  }

  /**
   * 预加载
   * @deprecated use preloadFullJSBundle instead
   * @param bundles
   */
  async preLoadBundle(bundles: string[]) {
    for (let index = 0; index < bundles.length; index++) {
      const bundleName = bundles[index];
      await this.createInstanceIfNeed(bundleName)
    }
  }

  // ─── 预加载 Type 1：仅预加载 common bundle ─────────────────────────────

  /**
   * bundle 就绪后自动补充 common 预备池（由 RNInstanceWrapper 内部触发）。
   * 通过 preloadQueue 入队，确保与业务预加载串行执行，common 任务优先。
   */
  refillCommonPoolIfNeeded(): void {
    console.log(`${TAG_PRELOAD}-RNINStanceManager.refillCommonPoolIfNeeded:`)
    if (!this.isAnySplitBundleMode()) return
    this.preloadQueue.enqueueCommon()
  }

  /** 创建一个 common bundle 已加载的 RNInstance（供 commonPool 的 factory 使用） */
  private async createCommonInstance(): Promise<RNInstance> {
    console.log(`${TAG_PRELOAD}-RNINStanceManager.createCommonInstance:`)
    this.gcIfNeeded()
    const rnohCoreContext: RNOHCoreContext | undefined = AppStorage.get<RNOHCoreContext>(APP_RNOH_RNOHCoreContext)
    if (!rnohCoreContext) throw new Error('RNOHCoreContext not ready')
    const options = this.options.getRNInstanceOptions(null)
    const rnInstance = await rnohCoreContext.createAndRegisterRNInstance(options)
    await this.loadCommonBundleOnInstance(rnInstance)
    return rnInstance
  }

  // ─── 预加载 Type 2：预加载 common + biz bundle ──────────────────────────

  /**
   * 预加载指定业务 bundle（业务侧触发）。
   * 入队到 preloadQueue，与 common 预备池填充串行执行，common 任务优先。
   */
  preloadFullJSBundle(bundleName: string): void {
    console.log(`${TAG_PRELOAD}-RNINStanceManager.preloadFullJSBundle: bundleName=${bundleName}`)
    this.preloadQueue.enqueueBiz(bundleName)
  }

  /** 实际执行业务 bundle 预加载（由 preloadQueue 调度） */
  private async _doPreloadFullJSBundle(bundleName: string): Promise<void> {
    console.log(`${TAG_PRELOAD}-RNINStanceManager._doPreloadFullJSBundle: bundleName=${bundleName}`)
    this.gcIfNeeded()
    const rnInstance = await this.createInstanceIfNeed(bundleName);
    (rnInstance as XRNInstanceImpl).setBundleInfo(BundleInfoManager.INSTANCE.getBundleInfo(bundleName))
    const provider = this.getRNInstanceWrapperByBundle(bundleName)!.jsBundleProvider
    try {
      await rnInstance.runJSBundle(provider)
      this.getBundleStateWrapper(bundleName)?.setFirstLoad(false)
    } catch (err) {
      console.error(`${TAG_PRELOAD}-${RNInstanceManager.TAG}._doPreloadFullJSBundle: failed=${JSON.stringify(err)}`)
    }
  }

  // ─── 内存管理 ──────────────────────────────────────────────────────────

  /** 系统低内存回调（由 XRNInstancesCoordinator.onMemoryLevel 触发） */
  async gcOnMemoryLevel(level: number): Promise<void> {
    console.info(`${TAG_PRELOAD}-${RNInstanceManager.TAG}.gcOnMemoryLevel: level=${level}`)
    await this.gcUnusedInstances(true)
  }

  /** 预加载前主动 GC：未配置 maxMemoryKB 时跳过；按 LRU 逐个回收，每次回收后重新检测内存 */
  async gcIfNeeded(): Promise<void> {
    console.info(`${TAG_PRELOAD}-${RNInstanceManager.TAG}.gcIfNeeded:`)
    if (this.isMemoryPressured()) {
      await this.gcByLRU()
    } else {
      console.info(`${TAG_PRELOAD}-${RNInstanceManager.TAG}.gcIfNeeded:is not isMemoryPressured`)
    }
  }

  /** 基于 LRU（解绑时间最早优先）逐个回收空闲 RNInstance，回收一个后重新检测内存，不回收 Common RNInstance */
  private async gcByLRU(): Promise<void> {
    console.info(`${TAG_PRELOAD}-${RNInstanceManager.TAG}.gcByLRU:`)
    // 候选：JS_READY、无绑定 View 且已有过解绑记录
    const candidates: Array<{ bundleName: string; unbindTime: number }> = []
    this.bundle2StateMap.forEach((sw, bn) => {
      if (sw.bundleState === BundleState.JS_READY && sw.getRNViewCount() === 0) {
        // lastUnbindTime === 0 表示从未绑定过，视为最久未使用，排在最前面
        candidates.push({ bundleName: bn, unbindTime: sw.getLastUnbindTime() })
      }
    })
    // 按解绑时间升序排序（最早解绑 = 最久未使用，优先回收）
    candidates.sort((a, b) => a.unbindTime - b.unbindTime)
    for (const { bundleName } of candidates) {
      if (!this.isMemoryPressured()) break
      console.info(`${TAG_PRELOAD}-${RNInstanceManager.TAG}.gcByLRU: recycling ${bundleName}`)
      await this.releaseRNInstance(bundleName)
    }
  }

  private isMemoryPressured(): boolean {
    if (!this.options.isMemoryPressured) return false;
    return this.options.isMemoryPressured()
  }

  private async gcUnusedInstances(includeCommonPool: boolean): Promise<void> {
    console.info(`${TAG_PRELOAD}-${RNInstanceManager.TAG}.gcUnusedInstances: includeCommonPool=${includeCommonPool}`)
    const rnohCoreContext: RNOHCoreContext | undefined = AppStorage.get<RNOHCoreContext>(APP_RNOH_RNOHCoreContext)
    if (!rnohCoreContext) return
    const candidates: string[] = []
    this.bundle2StateMap.forEach((sw, bn) => {
      if (sw.bundleState === BundleState.JS_READY && sw.getRNViewCount() === 0) {
        candidates.push(bn)
      }
    })
    for (const bn of candidates) {
      console.info(`${TAG_PRELOAD}-${RNInstanceManager.TAG}.gcUnusedInstances: recycling ${bn}`)
      await this.releaseRNInstance(bn)
    }
    if (includeCommonPool) {
      await this.commonPool.drain(async (inst) => {
        inst.enableFeatureFlag("ENABLE_RN_INSTANCE_CLEAN_UP")
        await rnohCoreContext.destroyAndUnregisterRNInstance(inst)
      })
    }
  }

  // ─── 内部辅助 ──────────────────────────────────────────────────────────

  /** 是否存在任意一个 bundle 开启了拆包（用于决定是否需要维护 common pool） */
  private isAnySplitBundleMode(): boolean {
    return BundleInfoManager.INSTANCE.BUNDLE_INFOS.some(info => isSplitMode(info.bundleName))
  }

  private setBundleInfoOnInstance(instance: RNInstance, bundleInfo: BundleInfo) {
    const impl = instance as any
    if (typeof impl.setBundleInfo === 'function') {
      impl.setBundleInfo(bundleInfo)
    } else {
      console.log(`${TAG_PRELOAD}-${RNInstanceManager.TAG}.setBundleInfoOnInstance:instance has not setBundleInfo function`)
    }
  }

  private async loadCommonBundleOnInstance(instance: RNInstance): Promise<void> {
    await (instance as XRNInstanceImpl)?.loadCommonBundle()
  }

}
