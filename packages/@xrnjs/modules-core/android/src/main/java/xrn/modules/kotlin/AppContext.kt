package xrn.modules.kotlin

import android.app.Activity
import android.content.Context
import com.facebook.react.bridge.ReactApplicationContext
import xrn.modules.kotlin.exception.Exceptions
import xrn.modules.kotlin.providers.CurrentActivityProvider
import java.lang.ref.WeakReference

class AppContext(reactContextHolder: WeakReference<ReactApplicationContext>) :
    CurrentActivityProvider {

    // The main context used in the app.
    // Modules attached to this context will be available on the main js context.
    val hostingRuntimeContext = RuntimeContext(this, reactContextHolder)

    val reactContext: Context?
        get() = hostingRuntimeContext.reactContext

    override val currentActivity: Activity?
        get() {
            return (reactContext as? ReactApplicationContext)?.currentActivity
        }

    val throwingActivity: Activity
        get() {
            val current = (reactContext as? ReactApplicationContext)?.currentActivity
            return current ?: throw Exceptions.MissingActivity()
        }
}