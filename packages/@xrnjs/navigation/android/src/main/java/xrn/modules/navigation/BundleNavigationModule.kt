package xrn.modules.navigation

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import xrn.modules.multibundle.bundle.RNHostManager
import xrn.modules.navigation.kotlin.NavHelper


class BundleNavigationModule(val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "BundleNavigation"
    }

    @ReactMethod
    fun navPushBundleProject(bundleName: String, moduleName: String?, params: String?) {
        NavHelper.jump2Module(currentActivity, bundleName, moduleName, params)
    }

    @ReactMethod
    fun publishSingleBundleEvent(eventName: String, params: String?) {
        reactContext.emitDeviceEvent(eventName, params)
    }

    @ReactMethod
    fun publishAllBundleEvent(eventName: String, params: String?) {
        RNHostManager.getAllRNHostWrapper().forEach {
            it.rnHost.reactInstanceManager.currentReactContext?.let { context ->
                context.emitDeviceEvent(eventName, params)
            }
        }
    }

    @ReactMethod
    fun goBack() {
        currentActivity?.finish()
    }

    @ReactMethod
    fun finish() {
        currentActivity?.finish()
    }

    @ReactMethod
    fun navReplaceBundleProject(bundleName: String, moduleName: String?, params: String?) {
        if (NavHelper.jump2Module(currentActivity, bundleName, moduleName, params)) {
            currentActivity?.finish()
        }
    }

    // Required for rn built in EventEmitter Calls.
    @ReactMethod
    fun addListener(eventName: String?) {
    }

    @ReactMethod
    fun removeListeners(count: Int?) {
    }

}