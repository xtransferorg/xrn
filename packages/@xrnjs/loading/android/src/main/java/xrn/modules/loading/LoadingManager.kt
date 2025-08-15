package xrn.modules.loading

import android.app.Activity
import xrn.modules.loading.internal.LoadingDialogMgr
import xrn.modules.loading.internal.SplashDialogMgr

object LoadingManager {

    fun showSplash(activity: Activity?) {
        SplashDialogMgr.show(activity)
    }

    fun hideSplash(activity: Activity?) {
        SplashDialogMgr.dismiss(activity)
    }

    fun showLoading(activity: Activity?) {
        LoadingDialogMgr.show(activity)
    }

    fun hideLoading(activity: Activity?) {
        LoadingDialogMgr.dismiss(activity)
    }

    fun updateProgress(activity: Activity?, progress: Int) {
        LoadingDialogMgr.updateProgress(activity, progress)
    }

}