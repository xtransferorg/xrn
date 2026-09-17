package xrn.modules.navigation

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.module.annotations.ReactModule
import xrn.modules.multibundle.ReactHostManager
import xrn.modules.navigation.kotlin.NavHelper

@ReactModule(name = BundleNavigationModule.NAME)
class BundleNavigationModule(val reactContext: ReactApplicationContext) :
    NativeBundleNavigationModuleSpec(reactContext) {

    override fun getName(): String {
        return NAME
    }

    @ReactMethod
    override fun navPushBundleProject(bundleName: String, moduleName: String?, params: String?): Boolean {
        NavHelper.jump2Module(currentActivity, bundleName, moduleName, params)
        return true
    }

    @ReactMethod
    override fun publishSingleBundleEvent(eventName: String, params: String?): Boolean {
        reactContext.emitDeviceEvent(eventName, params)
        return true
    }

    @ReactMethod
    override fun publishAllBundleEvent(eventName: String, params: String?): Boolean {
        ReactHostManager.all().forEach {
            if ( it.currentReactContext?.hasReactInstance() == true) {
                it.currentReactContext?.emitDeviceEvent(eventName, params)
            }
        }
        return true
    }

    @ReactMethod
    override fun goBack(): Boolean {
        currentActivity?.finish()
        return true
    }

    @ReactMethod
    fun finish() {
        currentActivity?.finish()
    }

    @ReactMethod
    override fun navReplaceBundleProject(bundleName: String, moduleName: String?, params: String?): Boolean {
        if (NavHelper.jump2Module(currentActivity, bundleName, moduleName, params)) {
            currentActivity?.finish()
        }
        return true
    }

    companion object {
        const val NAME = "BundleNavigation"
    }

}