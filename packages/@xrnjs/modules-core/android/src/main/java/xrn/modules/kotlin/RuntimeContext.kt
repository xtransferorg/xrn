package xrn.modules.kotlin

import com.facebook.react.bridge.ReactApplicationContext
import java.lang.ref.WeakReference

class RuntimeContext(
    appContext: AppContext,
    val reactContextHolder: WeakReference<ReactApplicationContext>
) {

    private val appContextHolder = appContext.weak()

    val appContext: AppContext?
        get() = appContextHolder.get()

    inline val reactContext: ReactApplicationContext?
        get() = reactContextHolder.get()
}