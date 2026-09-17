package xrn.modules.navigation.reactnative

import android.app.Activity
import com.blankj.utilcode.util.GsonUtils
import xrn.modules.navigation.reactnative.bean.NavigationAction
import xrn.modules.navigation.reactnative.bean.NavigationActionType
import xrn.modules.navigation.reactnative.handler.GoBackActionHandler
import xrn.modules.navigation.reactnative.handler.NavigateActionHandler
import xrn.modules.navigation.reactnative.handler.PushActionHandler
import xrn.modules.navigation.reactnative.handler.ReplaceActionHandler


internal object NavigationModule {

    private val ACTION_HANDLER_MAP by lazy {
        mapOf(
            NavigationActionType.NAVIGATE to NavigateActionHandler(),
            NavigationActionType.REPLACE to ReplaceActionHandler(),
            NavigationActionType.PUSH to PushActionHandler(),
            NavigationActionType.GO_BACK to GoBackActionHandler(),
        )
    }

    fun dispatchAction(currentActivity: Activity, jsonAction: String): Boolean {
        val action = GsonUtils.fromJson(jsonAction, NavigationAction::class.java)

        return dispatchAction(currentActivity, action)
    }

    fun dispatchAction(currentActivity: Activity, action: NavigationAction): Boolean {
        val handler = ACTION_HANDLER_MAP[action.type] ?: return false

        return handler.handle(currentActivity, action)
    }

    fun beforeAppCrash() {
        NavigationState.beforeAppCrash()
    }

}