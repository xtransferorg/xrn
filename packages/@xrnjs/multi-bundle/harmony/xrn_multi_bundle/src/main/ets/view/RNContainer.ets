import {
  RNInstance,
  RNOHCoreContext,
  RNOHLogger } from '@rnoh/react-native-openharmony'
import {XRNApp, XRNJSPackagerClientConfig} from '../XRNOH'
import { APP_BUNDLE_BUNDLE_INFO_MANAGER,
  APP_RNOH_RNOHCoreContext,
  APP_RN_BUNDLE_STATE_MAP, APP_RN_RNINSTANCE_MAP} from '../Constants'
import { BundleInfoManager } from '../bundle/BundleInfoManager'
import { RN_INSTANCE_MANAGER, RNInstanceWrapper, BundleState, BundleStateWrapper } from '../bundle/RNInstanceManager'
import { BundleInfo } from '../bundle/BundleInfo'
import {
  getJSBundleProvider,
  getRNInstanceConfig, getWrappedCustomRNComponentBuilder, globalRNContainerOptions } from './RNContainerHelper'

/**
 * React Native Container Component
 *
 * Responsible only for rendering and refreshing the UI component,
 * as well as interacting with the internal React Native instance.
 *
 * The lifecycle of RNInstance (creation and destruction) is managed by RNInstanceManager.
 */
@Component
export struct RNContainer {
  private static TAG = 'RNContainer'

  /**
   * Name of the bundle to load
   */
  @Require
  bundleName: string = "unknown"
  /**
   * Name of the module
   */
  @Require
  moduleName: string = "unknown"
  /**
   * Initial props passed to the RN view
   */
  @Require
  initialProps: Record<string, string> | undefined

  /**
   * Reference to the RNOH core context
   */
  @StorageLink('RNOHCoreContext')
  private rnohCoreContext: RNOHCoreContext | undefined = undefined

  /**
   * Reference to the bundle info manager
   */
  @StorageLink(APP_BUNDLE_BUNDLE_INFO_MANAGER)
  private bundleInfoManager: BundleInfoManager | undefined = undefined
  /**
   * Cached bundle info for this container
   */
  private bundleInfo: BundleInfo | undefined

  /**
   * Map of RN instances, keyed by bundle name
   */
  @StorageProp(APP_RN_RNINSTANCE_MAP)
  @Watch('onPropertyChange')
  private rnInstanceMap: Map<string, RNInstanceWrapper> | undefined = undefined
  /**
   * Map of bundle states, keyed by bundle name
   */
  @StorageProp(APP_RN_BUNDLE_STATE_MAP)
  @Watch('onPropertyChange')
  private bundleStateMap: Map<string, BundleStateWrapper> | undefined = undefined

  /**
   * Currently bound RN instance
   */
  @State
  private rnInstance: RNInstance | undefined = undefined

  private logger!: RNOHLogger

  /**
   * Index of the current RNContainer.
   * Starts from 1 when valid.
   */
  private rnContainerIndex = 0;
  /**
   * Indicates whether the JS bundle has finished loading
   */
  @State
  private jsBundleReady: boolean = false

  /**
   * Callback method triggered when a @Watch variable changes.
   * @param propName - Name of the property that changed
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
    // Use cached instance if available, otherwise create a new one
    this.rnInstance = RN_INSTANCE_MANAGER.getRNInstanceByBundle(this.bundleName)
    if (!this.rnInstance) {
      this.rnInstance = await RN_INSTANCE_MANAGER.createInstanceIfNeed(this.bundleName)
    }
    // Generate RNContainer index value
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
   * This method should only be called inside the build() function.
   * Determines whether the RN application should be displayed.
   * @returns {boolean} Whether to show the RN app.
   */
  private needShowRNApp(): boolean {
    const bundleStateWrapper = RN_INSTANCE_MANAGER.getBundleStateWrapper(this.bundleName)
    let showRNApp = false
    if (!this.rnInstance) {
      showRNApp = false
    } else if (this.jsBundleReady) {
      showRNApp = true
    } else {
      // When a single bundle has multiple SurfaceHandles, only one RNApp is responsible for
      // triggering the destruction and recreation of the RNInstance.
      // The RNApp will be shown only after the new RNInstance is created and the JS is ready.
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
          onReload: async (ins, reason) => {
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
          }
        })
      }
    }
    .alignItems(HorizontalAlign.Center)
    .backgroundColor(Color.White)
  }
}