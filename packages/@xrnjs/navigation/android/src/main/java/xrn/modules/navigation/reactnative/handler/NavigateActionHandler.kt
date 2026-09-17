package xrn.modules.navigation.reactnative.handler

import com.blankj.utilcode.util.GsonUtils
import com.blankj.utilcode.util.LogUtils
import xrn.modules.navigation.kotlin.NavigationStateHolderProvider
import xrn.modules.navigation.kotlin.bean.NavigationRouteConfig
import xrn.modules.navigation.reactnative.bean.NavigationAction
import xrn.modules.navigation.reactnative.bean.NavigationState
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

            stateHolder.bundleName == bundleName &&
                    stateHolder.moduleName == moduleName &&
                    hasSamePage(stateHolder.rnRootState, targetRoute.pageName)
        }

        if (targetIndex >= 0) {
            val targetActivity = activityList[targetIndex]
            sendDispatchActionEvent(targetActivity, originAction) { action, target ->
                action.copy(
                    payload = originAction.payload?.copy(name = targetRoute.pageName),
                    target = target
                )
            }
            finishActivities(targetIndex)
        } else {
            startNewActivity(originAction, targetRoute)
        }

        return true
    }

    private fun finishActivities(targetIndex: Int) {
        if (targetIndex == 0) return

        for (i in (targetIndex - 1) downTo 0) {
            activityList[i].finish()
        }
    }

    /**
     * 通过容器缓存的 RN 导航状态（rnRootState）判断其当前激活页面是否与目标页面一致。
     *
     * - 目标未指定具体页面（pageName 为空）时，仅按 bundle + module 匹配。
     * - 无法解析出当前页面（状态尚未保存或格式异常）时，回退到 bundle + module 匹配，避免误判导致重复开页。
     */
    private fun hasSamePage(rnRootState: String?, targetPageName: String?): Boolean {
        if (rnRootState.isNullOrBlank() || targetPageName.isNullOrBlank()) return false

        return try {
            val state = GsonUtils.fromJson(rnRootState, NavigationState::class.java)
            containsPage(state, targetPageName)
        } catch (e: Exception) {
            LogUtils.e("Failed to parse rnRootState: ", e)
            false
        }
    }

    /**
     * 递归遍历导航状态树（含嵌套导航器的 route.state），判断是否存在 name 与目标页面一致的路由。
     */
    private fun containsPage(state: NavigationState?, targetPageName: String): Boolean {
        val routes = state?.routes ?: return false

        return routes.any { route ->
            route.name == targetPageName || containsPage(route.state, targetPageName)
        }
    }

}