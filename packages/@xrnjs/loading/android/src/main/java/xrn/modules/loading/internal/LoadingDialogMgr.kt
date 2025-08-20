package xrn.modules.loading.internal

import android.annotation.SuppressLint
import android.app.Activity
import androidx.appcompat.app.AppCompatActivity

internal object LoadingDialogMgr {

    private const val TAG = "LoadingDialog"

    fun show(activity: Activity?) {
        if (activity == null) {
            return
        }

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
        if (activity == null) {
            return
        }

        ThreadUtils.runOnUiThread {
            requireDialogFragment(activity)?.dismissAllowingStateLoss()
        }
    }

    @SuppressLint("SetTextI18n")
    fun updateProgress(activity: Activity?, progress: Int) {
        if (activity == null) {
            return
        }

        ThreadUtils.runOnUiThread {
            requireDialogFragment(activity)?.updateProgress(progress)
        }
    }

    private fun requireDialogFragment(activity: Activity): LoadingDialogFragment? {
        return (activity as AppCompatActivity)
            .supportFragmentManager
            .findFragmentByTag(TAG) as LoadingDialogFragment?
    }

}