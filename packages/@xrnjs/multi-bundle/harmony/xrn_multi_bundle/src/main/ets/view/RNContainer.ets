import {
  RNInstance,
  RNOHCoreContext,
  RNOHLogger } from '@rnoh/react-native-openharmony'
import { APP_BUNDLE_BUNDLE_INFO_MANAGER,
  APP_RNOH_RNOHCoreContext,
  APP_RN_BUNDLE_STATE_MAP, APP_RN_RNINSTANCE_MAP} from '../Constants'
import { BundleInfoManager } from '../bundle/BundleInfoManager'
import { RN_INSTANCE_MANAGER, RNInstanceWrapper, BundleState, BundleStateWrapper } from '../bundle/RNInstanceManager'
import { BundleInfo } from '../bundle/BundleInfo'
import {
  getJSBundleProvider,
  getRNInstanceConfig, getWrappedCustomRNComponentBuilder, globalRNContainerOptions } from './RNContainerHelper'
import { XRNApp } from '../XRNOH/XRNApp'
import { XRNJSPackagerClientConfig } from '../XRNOH'

/**
 * RN 容器组件，只负责组件刷新，以及和 RN 内部的交互；
 * RNInstance 由 RNInstanceManager 管理，创建和销毁；
 */
@Component
export struct RNContainer {
  private static TAG = 'RNContainer'

  @Require
  bundleName: string = "unknown"
  @Require
  moduleName: string = "unknown"
  @Require
  initialProps: Record<string, string> | undefined

  @StorageLink('RNOHCoreContext')
  private rnohCoreContext: RNOHCoreContext | undefined = undefined

  @StorageLink(APP_BUNDLE_BUNDLE_INFO_MANAGER)
  private bundleInfoManager: BundleInfoManager | undefined = undefined
  private bundleInfo: BundleInfo | undefined

  @StorageProp(APP_RN_RNINSTANCE_MAP)
  @Watch('onPropertyChange')
  private rnInstanceMap: Map<string, RNInstanceWrapper> | undefined = undefined
  @StorageProp(APP_RN_BUNDLE_STATE_MAP)
  @Watch('onPropertyChange')
  private bundleStateMap: Map<string, BundleStateWrapper> | undefined = undefined

  @State
  private rnInstance: RNInstance | undefined = undefined

  private logger!: RNOHLogger

  /**
   * 索引值
   * 从1开始有效
   */
  private rnContainerIndex = 0;
  @State
  private jsBundleReady: boolean = false

  /**
   * @Watch 变量变更时的回调方法
   * @param propName
   */
  onPropertyChange(propName: string) {
    if (propName === 'rnInstanceMap') {
      this.rnInstance = this.rnInstanceMap?.get(this.bundleName)?.instance
    }
    if (propName === 'bundleStateMap') {
      this.jsBundleReady = this.bundleStateMap?.get(this.bundleName)?.bundleState === BundleState.JS_READY
    }
    console.debug(`${RNContainer.TAG}.onPropertyChange.end:propName=${propName}, rnInstance=${this.rnInstance}, bundleNaem=${this.bundleName}`)
  }

  async aboutToAppear(): Promise<void> {
    this.bundleInfo = this.bundleInfoManager?.getBundleInfo(this.bundleName)
    //有缓存直接用，无缓存创建
    this.rnInstance = RN_INSTANCE_MANAGER.getRNInstanceByBundle(this.bundleName)
    if (!this.rnInstance) {
      this.rnInstance = await RN_INSTANCE_MANAGER.createInstanceIfNeed(this.bundleName)
    }
    //生成 RNContainer 索引值
    const bundleStateWrapper = RN_INSTANCE_MANAGER.getBundleStateWrapper(this.bundleName)
    this.rnContainerIndex = bundleStateWrapper?.createIndexForRNContainer() || 0
    if (this.rnContainerIndex > 0) {
      bundleStateWrapper?.addIndex(this.rnContainerIndex)
    }
    console.log(`RNContainer.aboutToAppear:rnInstance=${this.rnInstance}, bundleName=${this.bundleName}, rnContainerIndex=${this.rnContainerIndex}`)
  }

  aboutToDisappear(): void {
    const bundleStateWrapper = RN_INSTANCE_MANAGER.getBundleStateWrapper(this.bundleName)
    if (this.rnContainerIndex > 0) {
      bundleStateWrapper?.deleteIndex(this.rnContainerIndex)
    }
    console.log(`RNContainer.aboutToDisappear:this.rnContainerIndex=${this.rnContainerIndex}, bundleName=${this.bundleName}`)
  }

  private onSetup(rnInstance: RNInstance) {
    console.debug(`${RNContainer.TAG}.onSetup:rnInstance=${this.rnInstance}`)
    globalRNContainerOptions.onSetup(rnInstance, this.bundleName)
  }

  /**
   * 该方法只能在 build() 中调用；
   * @returns
   */
  private needShowRNApp(): boolean {
    const bundleStateWrapper = RN_INSTANCE_MANAGER.getBundleStateWrapper(this.bundleName)
    let showRNApp = false
    if (!this.rnInstance) {
      showRNApp = false
    } else if (this.jsBundleReady) {
      showRNApp = true
    } else {
      //一个Bundle多个SurfaceHandle时，只由一个RNApp触发销毁和重新创建 RNInstance，等新的 RNInstance 创建好，JS Ready时，再显示 RNApp
      showRNApp = this.rnContainerIndex === bundleStateWrapper?.getLastIndex()
    }
    console.log(`RNContainer.needShowRNApp:needShow=${showRNApp}, bundleName=${this.bundleName}, bundleState = ${bundleStateWrapper?.bundleState}, this.rnContainerIndex=${this.rnContainerIndex}, maxIndex=${bundleStateWrapper?.getLastIndex()}, rnInstance=${this.rnInstance}`)
    return showRNApp
  }

  build() {
    Column() {
      if (this.needShowRNApp()) {
        XRNApp({
          bundleName: this.bundleName,
          rnInstanceConfig: getRNInstanceConfig(this.bundleName),
          initialProps: this.initialProps,
          appKey: this.moduleName,
          wrappedCustomRNComponentBuilder: getWrappedCustomRNComponentBuilder(this.bundleName),
          onSetUp: (rnInstance) => {
            this.onSetup(rnInstance)
          },
          jsBundleProvider: getJSBundleProvider(this.bundleName),
          onReload: async (instance, reason) => {
            if(reason) {
              try {
                const data: XRNJSPackagerClientConfig = JSON.parse(reason)
                const mgr = AppStorage.get<BundleInfoManager>(APP_BUNDLE_BUNDLE_INFO_MANAGER)
                const info = mgr?.findBundleInfoByPort(data.port)
                if (info?.bundleName && info.bundleName === this.bundleName) {
                  RN_INSTANCE_MANAGER.reCreateRNInstance(info.bundleName)
                }
              } catch(error){
                this.logger.error('事件处理出错', reason, error)
              }
            }
          }
        }).onAppear(() => {
          RN_INSTANCE_MANAGER.getBundleStateWrapper(this.bundleName)?.addRNViewCount()
        }).onDisAppear(() => {
          const bundleStateWrapper = RN_INSTANCE_MANAGER.getBundleStateWrapper(this.bundleName)
          bundleStateWrapper?.minusRNViewCount()
          if (bundleStateWrapper?.getRNViewCount() === 0 && bundleStateWrapper.bundleState === BundleState.RELOADING) {
            setTimeout(async () => {
              const reloadRNInstance = bundleStateWrapper?.rnInstance
              reloadRNInstance?.enableFeatureFlag("ENABLE_RN_INSTANCE_CLEAN_UP")
              const rnohCoreContext: RNOHCoreContext | undefined = AppStorage.get<RNOHCoreContext>(APP_RNOH_RNOHCoreContext)
              await rnohCoreContext?.destroyAndUnregisterRNInstance(reloadRNInstance)
              await RN_INSTANCE_MANAGER.createInstanceIfNeed(this.bundleName)
            })
          } else if (bundleStateWrapper?.getRNViewCount() === 0 && bundleStateWrapper.bundleState === BundleState.RELEASING) {
            setTimeout(async () => {
              const releaseRNInstance = bundleStateWrapper?.rnInstance
              releaseRNInstance?.enableFeatureFlag("ENABLE_RN_INSTANCE_CLEAN_UP")
              const rnohCoreContext: RNOHCoreContext | undefined = AppStorage.get<RNOHCoreContext>(APP_RNOH_RNOHCoreContext)
              await rnohCoreContext?.destroyAndUnregisterRNInstance(releaseRNInstance)
            })
          }
        })
      }
    }
    .alignItems(HorizontalAlign.Center)
    .backgroundColor(Color.White)
  }
}