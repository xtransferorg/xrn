import { RNInstance } from "@rnoh/react-native-openharmony";
import NavDestinationMgr, { IndexedNativeNavDestinationStateHolder } from "../../../native/NavDestinationMgr";
import { startModuleContainer } from "../../../native/NavHelper";
import { IActionHandler, NavigationRouteConfig } from "../../types/NativeTypes";
import { RNNavigationAction } from "../../types/ReactNativeTypes";

const EVENT_NAME = 'NATIVE_DISPATCH_ACTION'

export abstract class BaseActionHandler implements IActionHandler {
  abstract handle(originAction: RNNavigationAction): boolean

  protected startModuleContainer(originAction: RNNavigationAction, targetRoute: NavigationRouteConfig) {
    const res = startModuleContainer(targetRoute.bundleName, targetRoute.moduleName, {
      initialRouteName: targetRoute.pageName,
      initialRouteParams: originAction?.payload?.params
    })

    return res
  }

  protected sendDispatchActionEvent(reactInstance: RNInstance, newAction: RNNavigationAction) {
    reactInstance.emitDeviceEvent(EVENT_NAME, JSON.stringify(newAction))
  }

  protected getMatchedNavDestinationStateByRNId(rnId: string): IndexedNativeNavDestinationStateHolder | null {
    return NavDestinationMgr.matched(rnId)
  }

  protected getMatchedNavDestinationState(targetRoute: NavigationRouteConfig): IndexedNativeNavDestinationStateHolder | null {
    return NavDestinationMgr.lastMatched(targetRoute.bundleName, targetRoute.moduleName)
  }

}
