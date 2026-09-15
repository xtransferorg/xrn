package xrn.modules.loading.internal

import android.app.Activity
import androidx.annotation.FloatRange
import androidx.appcompat.app.AppCompatActivity
import java.lang.ref.WeakReference

internal object SplashDialogMgr {

    private const val TAG = "SplashDialog"

    private var lastAttachedActivityRef: WeakReference<Activity>? = null

    fun show(activity: Activity?, isForceLastScreen: Boolean = false) {
        if (activity == null) {
            return
        }

        lastAttachedActivityRef = WeakReference(activity)

        ThreadUtils.runOnUiThread {
            var dialogFragment = requireDialogFragment(activity)

            if (dialogFragment == null || !dialogFragment.isAdded) {
                dialogFragment = SplashDialogFragment()
                dialogFragment.isForceLastScreen = isForceLastScreen

                (activity as AppCompatActivity)
                    .supportFragmentManager
                    .beginTransaction()
                    .add(dialogFragment, TAG)
                    .commitAllowingStateLoss()
            }
        }
    }

    fun dismiss(activity: Activity?) {
        ThreadUtils.runOnUiThread {
            val lastAttachedActivity = lastAttachedActivityRef?.get() ?: return@runOnUiThread
            requireDialogFragment(lastAttachedActivity)?.dismissAllowingStateLoss()
        }
    }

    fun updateProgress(activity: Activity?, progress: Int): Boolean {
        if (activity == null) {
            return false
        }

        val fragment = requireDialogFragment(activity) ?: return false
        if (!fragment.isAnimationEnd) return false
        ThreadUtils.runOnUiThread {
            fragment.updateProgress(progress)
        }
        return true
    }

    private fun requireDialogFragment(activity: Activity): SplashDialogFragment? {
        return (activity as AppCompatActivity)
            .supportFragmentManager
            .findFragmentByTag(TAG) as SplashDialogFragment?
    }

}