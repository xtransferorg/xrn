package xrn.modules.loading.internal

import com.facebook.react.bridge.UiThreadUtil

internal object ThreadUtils {

    fun runOnUiThread(action: () -> Unit) {
        if (UiThreadUtil.isOnUiThread()) {
            action.invoke()
        } else {
            UiThreadUtil.runOnUiThread(action)
        }
    }

}