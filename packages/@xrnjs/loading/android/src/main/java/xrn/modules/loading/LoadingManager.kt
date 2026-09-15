package xrn.modules.loading

import android.app.Activity
import androidx.annotation.FloatRange
import android.view.View
import xrn.modules.loading.internal.ErrorBoundaryDialogFragment
import xrn.modules.loading.internal.LoadingDialogMgr
import xrn.modules.loading.internal.SplashDialogMgr

object LoadingManager {

    fun showSplash(activity: Activity?, isForceLastScreen: Boolean = false) {
        SplashDialogMgr.show(activity, isForceLastScreen)
    }

    fun hideSplash(activity: Activity?) {
        SplashDialogMgr.dismiss(activity)
    }

    fun updateProgress(activity: Activity?, progress: Int, isSplash: Boolean): Boolean {
       return if (isSplash) {
            SplashDialogMgr.updateProgress(activity, progress)
        } else {
            LoadingDialogMgr.updateProgress(activity, progress)
        }
    }

    fun showLoading(activity: Activity?) {
        LoadingDialogMgr.show(activity)
    }

    fun hideLoading(activity: Activity?) {
        LoadingDialogMgr.dismiss(activity)
    }

    fun showErrorBoundary(
        activity: Activity?,
        hintText: String,
        buttonText: String,
        buttonClickListener: View.OnClickListener,
        backClickListener: View.OnClickListener? = null
    ) {
        ErrorBoundaryDialogFragment.show(activity, hintText, buttonText, buttonClickListener, backClickListener)
    }

    fun hideErrorBoundary() {
        ErrorBoundaryDialogFragment.dismiss()
    }

}