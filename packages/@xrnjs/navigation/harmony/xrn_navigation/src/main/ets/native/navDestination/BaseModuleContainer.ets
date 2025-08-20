import { RNInstanceManager, RNContainer, APP_RN_RNINSTANCE_MANAGER } from "xrn-multi-bundle"
import NavDestinationMgr from "../NavDestinationMgr"
import { getModuleRouteParams, RNAppInitialProps } from "../NavHelper"

@Component
export struct BaseModuleContainer {
  /*@StorageProp(APP_SYS_SYSTEM_BAR_HEIGHT)
  topRectHeight: number = 0;
  @StorageProp(APP_SYS_NAVIGATION_HEIGHT)
  bottomRectHeight: number = 0;*/

  @Builder
  DoNothingBuilder() {

  }

  @StorageLink(APP_RN_RNINSTANCE_MANAGER)
  private rnInstanceManager: RNInstanceManager | null = null
  @State
  bundleName: string = "unknown"
  @State
  moduleName: string = "unknown"
  @State
  initialProps?: Record<string, string> = undefined
  @BuilderParam child: () => void = this.DoNothingBuilder
  private navDestinationId: string | null | undefined = null

  aboutToAppear(): void {
    const params = getModuleRouteParams()
    if (params) {
      this.bundleName = params.bundleName
      this.moduleName = params.moduleName
      this.initialProps = {
        "bundleName": params.bundleName,
        "moduleName": params.moduleName,
        "params": JSON.stringify(transformInitialProps(params.initialProps))
      }
    }
  }

  build() {
    NavDestination() {
      RNContainer({
        bundleName: this.bundleName,
        moduleName: this.moduleName,
        initialProps: this.initialProps,
      })
      this.child()
    }
    .hideTitleBar(true)
    .hideToolBar(true)
    // .padding({ top: px2vp(this.topRectHeight), bottom: px2vp(this.bottomRectHeight) })
    .onReady((ctx: NavDestinationContext) => {
      this.navDestinationId = ctx.navDestinationId
    })
    .onAppear(() => {
      if (this.navDestinationId) {
        NavDestinationMgr.push(this.navDestinationId, this.bundleName, this.moduleName)
      }
    })
    .onDisAppear(() => {
      if (this.navDestinationId) {
        NavDestinationMgr.pop(this.navDestinationId)
      }
    })
    .onBackPressed(() => {
      const rnInstance = this.rnInstanceManager?.getRNInstanceByBundle(this.bundleName)

      if (rnInstance != null && NavDestinationMgr.getTopRnId() != null) {
        rnInstance.emitDeviceEvent('hardwareBackPress', {})
        return true
      }

      return false
    })
  }
}

function transformInitialProps(initialProps?: RNAppInitialProps): Record<string, string | Record<string, object>> {
  return initialProps ? (initialProps as Record<string, string | Record<string, object>>) : {}
}
