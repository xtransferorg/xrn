package xrn.modules.navigation.reactnative

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

    fun dispatchAction(jsonAction: String): Boolean {
        val action = GsonUtils.fromJson(jsonAction, NavigationAction::class.java)

        return dispatchAction(action)
    }

    fun dispatchAction(action: NavigationAction): Boolean {
        val handler = ACTION_HANDLER_MAP[action.type] ?: return false

        return handler.handle(action)
    }

    fun beforeAppCrash() {
        NavigationState.beforeAppCrash()
    }

}