import NavDestinationMgr from "../../native/NavDestinationMgr";
import { NavigationRouteConfig } from "../types/NativeTypes";
import { RNNavigationAction, RNNavigationActionType } from "../types/ReactNativeTypes";
import { getNativeTopReactInstance } from "../utils";
import { RoutingTableCheckedActionHandler } from "./base/RoutingTableCheckedActionHandler";

export class ReplaceActionHandler extends RoutingTableCheckedActionHandler {
  internalHandle(
    originAction: RNNavigationAction,
    targetRoute: NavigationRouteConfig
  ): boolean {
    const topReactInstance = getNativeTopReactInstance()
    const topRnId = NavDestinationMgr.getTopRnId()

    if (!topReactInstance || !topRnId) {
      return false
    }

    const res = this.startModuleContainer(originAction, targetRoute)

    if (res) {
      // 延时发送 GO_BACK 时间，规避回退和前进动画冲突。
      setTimeout(() => {
        const newAction = new RNNavigationAction(RNNavigationActionType.GO_BACK, originAction.source, null, topRnId)
        this.sendDispatchActionEvent(topReactInstance, newAction)
      }, 200)
    }

    return res
  }

}
