package xrn.modules.loading.internal

import android.annotation.SuppressLint
import android.app.Activity
import androidx.appcompat.app.AppCompatActivity
import java.lang.ref.WeakReference

internal object LoadingDialogMgr {

    private const val TAG = "LoadingDialog"

    private var lastAttachedActivityRef: WeakReference<Activity>? = null

    fun show(activity: Activity?) {
        if (activity == null) {
            return
        }

        lastAttachedActivityRef = WeakReference(activity)

        ThreadUtils.runOnUiThread {
            var dialogFragment = requireDialogFragment(activity)

            if (dialogFragment == null || !dialogFragment.isAdded) {
                dialogFragment = LoadingDialogFragment()

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
            lastAttachedActivityRef = null
        }
    }

    @SuppressLint("SetTextI18n")
    fun updateProgress(activity: Activity?, progress: Int): Boolean {
        if (activity == null) {
            return false
        }

        val fragment = requireDialogFragment(activity) ?: return false
        ThreadUtils.runOnUiThread {
            fragment.updateProgress(progress)
        }
        return true
    }

    private fun requireDialogFragment(activity: Activity): LoadingDialogFragment? {
        return (activity as AppCompatActivity)
            .supportFragmentManager
            .findFragmentByTag(TAG) as LoadingDialogFragment?
    }

}