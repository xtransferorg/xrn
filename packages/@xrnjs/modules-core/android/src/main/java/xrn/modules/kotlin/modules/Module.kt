package xrn.modules.kotlin.modules

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import xrn.modules.kotlin.AppContext
import xrn.modules.kotlin.providers.AppContextProvider
import xrn.modules.kotlin.weak

abstract class Module(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), AppContextProvider {

    override val appContext: AppContext by lazy {
        AppContext(reactContext.weak())
    }

    fun runOnUiQueueThread(block: () -> Unit) {
        if (reactApplicationContext.isOnUiQueueThread) {
            block.invoke()
        } else {
            reactApplicationContext.runOnUiQueueThread {
                block.invoke()
            }
        }
    }

}