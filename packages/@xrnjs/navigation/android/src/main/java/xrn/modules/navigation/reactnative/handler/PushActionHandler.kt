package xrn.modules.navigation.reactnative.handler

import xrn.modules.navigation.kotlin.bean.NavigationRouteConfig
import xrn.modules.navigation.reactnative.bean.NavigationAction
import xrn.modules.navigation.reactnative.handler.base.RoutingTableCheckedActionHandler


class PushActionHandler : RoutingTableCheckedActionHandler() {

    override fun internalHandle(
        originAction: NavigationAction, targetRoute: NavigationRouteConfig
    ): Boolean {
        return startNewActivity(originAction, targetRoute)
    }

}