import { ObjectUtil } from "@pura/harmony-utils";
import { getRNInstance } from "xrn-multi-bundle";
import { GlobalNavPathStack } from "../../native/NavHelper";
import { NavigationRouteConfig } from "../types/NativeTypes";
import { RNNavigationAction, RNNavigationActionType } from "../types/ReactNativeTypes";
import { RoutingTableCheckedActionHandler } from "./base/RoutingTableCheckedActionHandler";

export class NavigateActionHandler extends RoutingTableCheckedActionHandler {
  internalHandle(
    originAction: RNNavigationAction,
    targetRoute: NavigationRouteConfig
  ): boolean {
    const matchedState = this.getMatchedNavDestinationState(targetRoute)

    if (matchedState) {
      const targetIndex = matchedState.index
      const targetReactInstance = getRNInstance(matchedState.state.bundleName)
      const targetRnId = matchedState.state.rnId

      GlobalNavPathStack.popToIndex(targetIndex)

      if (!targetReactInstance || !targetRnId) {
        return false
      }

      const newPayload = ObjectUtil.deepCopy(originAction.payload)
      if (newPayload?.name) {
        newPayload.name = targetRoute.pageName
      }
      const newAction =
        new RNNavigationAction(RNNavigationActionType.NAVIGATE, originAction.source, newPayload, targetRnId)

      this.sendDispatchActionEvent(targetReactInstance, newAction)
    } else {
      this.startModuleContainer(originAction, targetRoute)
    }

    return true
  }
}
