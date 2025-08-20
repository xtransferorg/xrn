package xrn.modules.navigation.reactnative.handler

import xrn.modules.navigation.kotlin.NavigationStateHolderProvider
import xrn.modules.navigation.kotlin.bean.NavigationRouteConfig
import xrn.modules.navigation.reactnative.bean.NavigationAction
import xrn.modules.navigation.reactnative.handler.base.RoutingTableCheckedActionHandler


class NavigateActionHandler : RoutingTableCheckedActionHandler() {

    override fun internalHandle(
        originAction: NavigationAction, targetRoute: NavigationRouteConfig
    ): Boolean {
        val bundleName = targetRoute.bundleName
        val moduleName = targetRoute.moduleName

        val targetIndex = activityList.indexOfLast { act ->
            if (act !is NavigationStateHolderProvider) return@indexOfLast false

            val stateHolder = act.getNavigationStateHolder()

            stateHolder.bundleName == bundleName && stateHolder.moduleName == moduleName
        }

        if (targetIndex >= 0) {
            for (i in 0 until targetIndex) {
                activityList[i].finish()
            }

            sendDispatchActionEvent(topActivity, originAction) { action, target ->
                action.copy(
                    payload = originAction.payload?.copy(name = targetRoute.pageName),
                    target = target
                )
            }
        } else {
            startNewActivity(originAction, targetRoute)
        }

        return true
    }

}