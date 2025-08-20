import NativeNavigationRoutingTable from "../../NativeNavigationRoutingTable";
import { NavigationRouteConfig } from "../../types/NativeTypes";
import { RNNavigationAction } from "../../types/ReactNativeTypes";
import { BaseActionHandler } from "./BaseActionHandler";

export abstract class RoutingTableCheckedActionHandler extends BaseActionHandler {
  abstract internalHandle(
    originAction: RNNavigationAction,
    targetRoute: NavigationRouteConfig
  ): boolean

  handle(originAction: RNNavigationAction): boolean {
    const targetRoute = NativeNavigationRoutingTable.get(originAction.payload?.name)

    if (!targetRoute) {
      return false
    }

    return this.internalHandle(originAction, targetRoute)
  }
}