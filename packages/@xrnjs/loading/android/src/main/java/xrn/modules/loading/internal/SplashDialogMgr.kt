package xrn.modules.loading.internal

import android.app.Activity
import androidx.appcompat.app.AppCompatActivity

internal object SplashDialogMgr {

    private const val TAG = "SplashDialog"

    fun show(activity: Activity?) {
        if (activity == null) {
            return
        }

        ThreadUtils.runOnUiThread {
            var dialogFragment = requireDialogFragment(activity)

            if (dialogFragment == null || !dialogFragment.isAdded) {
                dialogFragment = SplashDialogFragment()

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

    private fun requireDialogFragment(activity: Activity): SplashDialogFragment? {
        return (activity as AppCompatActivity)
            .supportFragmentManager
            .findFragmentByTag(TAG) as SplashDialogFragment?
    }

}