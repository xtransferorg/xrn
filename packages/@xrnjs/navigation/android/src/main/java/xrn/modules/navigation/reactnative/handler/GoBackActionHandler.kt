package xrn.modules.navigation.reactnative.handler

import android.app.Activity
import xrn.modules.multibundle.bundle.BundleType
import xrn.modules.navigation.kotlin.NavHelper
import xrn.modules.navigation.kotlin.exception.GlobalExceptionHandler
import xrn.modules.navigation.kotlin.exception.MainBundleNotInStackException
import xrn.modules.navigation.reactnative.bean.NavigationAction
import xrn.modules.navigation.reactnative.handler.base.BaseActionHandler


class GoBackActionHandler : BaseActionHandler() {

    override fun handle(currentActivity: Activity, originAction: NavigationAction): Boolean {
        if (activityList.size <= 1) {
            if (isMainActivity(currentActivity)) {
                return false
            }

            val intent = NavHelper.buildMainModuleIntent(currentActivity) ?: return false
            currentActivity.startActivity(intent)
            currentActivity.finish()

            GlobalExceptionHandler.onMainBundleNotInStack()
            return true
        }

        currentActivity.finish()

        return true
    }

    private fun isMainActivity(activity: Activity): Boolean {
        val mainActClazz = NavHelper.activityClazzFactory?.get(BundleType.MAIN) ?: return false
        return mainActClazz.isInstance(activity)
    }

}
