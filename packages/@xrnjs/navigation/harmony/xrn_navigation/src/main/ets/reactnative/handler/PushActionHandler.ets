import { NavigationRouteConfig } from "../types/NativeTypes";
import { RNNavigationAction } from "../types/ReactNativeTypes";
import { RoutingTableCheckedActionHandler } from "./base/RoutingTableCheckedActionHandler";

export class PushActionHandler extends RoutingTableCheckedActionHandler {
  internalHandle(
    originAction: RNNavigationAction,
    targetRoute: NavigationRouteConfig
  ): boolean {
    return this.startModuleContainer(originAction, targetRoute)
  }
}
