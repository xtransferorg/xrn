package xrn.modules.navigation.reactnative.handler.base

import xrn.modules.navigation.kotlin.bean.NavigationRouteConfig
import xrn.modules.navigation.reactnative.NavigationRoutingTable
import xrn.modules.navigation.reactnative.bean.NavigationAction


abstract class RoutingTableCheckedActionHandler : BaseActionHandler() {

    abstract fun internalHandle(
        originAction: NavigationAction,
        targetRoute: NavigationRouteConfig
    ): Boolean

    override fun handle(originAction: NavigationAction): Boolean {
        val targetRoute = NavigationRoutingTable.get(originAction.payload?.name) ?: return false
        return internalHandle(originAction, targetRoute)
    }

}