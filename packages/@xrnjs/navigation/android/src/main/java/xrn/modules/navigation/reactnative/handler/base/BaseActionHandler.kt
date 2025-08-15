package xrn.modules.navigation.reactnative.handler.base

import android.app.Activity
import com.blankj.utilcode.util.ActivityUtils
import com.blankj.utilcode.util.GsonUtils
import com.blankj.utilcode.util.ToastUtils
import com.facebook.react.modules.core.DeviceEventManagerModule
import xrn.modules.navigation.kotlin.NavHelper
import xrn.modules.navigation.kotlin.BaseRNContainerActivity
import xrn.modules.navigation.kotlin.bean.NavigationRouteConfig
import xrn.modules.navigation.reactnative.handler.IActionHandler
import xrn.modules.navigation.reactnative.bean.NavigationAction


abstract class BaseActionHandler : IActionHandler {

    protected val topActivity: Activity?
        get() = ActivityUtils.getTopActivity()

    protected val activityList
        get() = ActivityUtils.getActivityList()

    protected fun startNewActivity(
        originAction: NavigationAction,
        targetRoute: NavigationRouteConfig
    ): Boolean {
        if (topActivity == null) return false

        val intent = NavHelper.buildIntent(
            topActivity!!,
            targetRoute.bundleName,
            targetRoute.moduleName,
            NavHelper.InitialProps(
                initialRouteName = targetRoute.pageName,
                initialRouteParams = originAction.payload?.params
            )
        )

        if (intent == null) {
            return false
        }

        topActivity!!.startActivity(intent)

        return true
    }

    protected fun sendDispatchActionEvent(
        activity: Activity?,
        originAction: NavigationAction,
        createActionFun: (NavigationAction, String) -> NavigationAction = defaultCreateActionFunc
    ) {
        if (activity == null || activity !is BaseRNContainerActivity) return

        val target = activity.getNavigationStateHolder().rnRootKey ?: return
        val host = activity.getRNHost() ?: return

        val newAction = createActionFun(originAction, target)

        host.reactInstanceManager.currentReactContext?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            ?.emit("NATIVE_DISPATCH_ACTION", GsonUtils.toJson(newAction))
    }

    private val defaultCreateActionFunc = { action: NavigationAction, target: String ->
        action.copy(
            target = target
        )
    }

}