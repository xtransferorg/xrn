package xrn.modules.navigation.reactnative.handler

import xrn.modules.navigation.kotlin.bean.NavigationRouteConfig
import xrn.modules.navigation.reactnative.bean.NavigationAction
import xrn.modules.navigation.reactnative.bean.NavigationActionType
import xrn.modules.navigation.reactnative.handler.base.RoutingTableCheckedActionHandler


class ReplaceActionHandler : RoutingTableCheckedActionHandler() {

    override fun internalHandle(
        originAction: NavigationAction,
        targetRoute: NavigationRouteConfig
    ): Boolean {
        val lastAct = this.topActivity

        val result = startNewActivity(originAction, targetRoute)

        if (result) {
            sendDispatchActionEvent(
                lastAct,
                NavigationAction(
                    source = originAction.source,
                    type = NavigationActionType.GO_BACK,
                )
            )
        }

        return result
    }

}