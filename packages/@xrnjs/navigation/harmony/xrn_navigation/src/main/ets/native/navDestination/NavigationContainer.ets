import { uiObserver } from '@kit.ArkUI';
import { RN_INSTANCE_MANAGER } from 'xrn-multi-bundle';
import NavDestinationMgr from '../NavDestinationMgr';
import { GlobalNavPathStack, NavPath, ModuleRouteParams } from '../NavHelper';


type NavDestinationBuilder = (name: string) => void

@Component
export struct NavigationContainer {
  @Provide('navigation') navigation: NavPathStack = GlobalNavPathStack

  @BuilderParam
  navDestination: NavDestinationBuilder

  onNavDestinationSwitch(info: uiObserver.NavDestinationSwitchInfo): void {
    const sendNativeFocusEvent = (info: uiObserver.NavDestinationInfo | NavBar, focus: boolean) => {
      const desInfo = info as uiObserver.NavDestinationInfo

      if (!desInfo || !desInfo.name) {
        return
      }

      const desParam = desInfo.param as ModuleRouteParams

      const bundleName = desParam.bundleName
      const moduleName = desParam.moduleName

      if (!bundleName || !moduleName) {
        return
      }

      const lastMatchedState = NavDestinationMgr.lastMatched(bundleName, moduleName)

      const rnId = lastMatchedState?.state.rnId

      if (!rnId) {
        return
      }

      const rnInstance = RN_INSTANCE_MANAGER.getRNInstanceByBundle(desParam.bundleName)

      if (!rnInstance) {
        return
      }

      const event = focus ? "XT_SCREEN_APPEAR" : "XT_SCREEN_DISAPPEAR"

      rnInstance.emitDeviceEvent(event, {
        "rootKey": rnId,
        "bundleName": desParam.bundleName,
        "moduleName": desParam.moduleName,
      })
    }

    sendNativeFocusEvent(info.from, false)
    sendNativeFocusEvent(info.to, true)
  }

  aboutToAppear(): void {
    uiObserver.on("navDestinationSwitch", this.getUIContext(), this.onNavDestinationSwitch)
    this.navigation.pushPathByName(NavPath.Splash, "")
  }

  aboutToDisappear() {
    uiObserver.off('navDestinationSwitch', this.getUIContext(), this.onNavDestinationSwitch)
  }

  build() {
    Navigation(this.navigation)
      .navDestination(this.navDestination)
      .mode(NavigationMode.Stack)
      .hideNavBar(true)
  }
}
