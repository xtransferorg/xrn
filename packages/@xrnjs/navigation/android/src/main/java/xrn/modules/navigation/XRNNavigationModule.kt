package xrn.modules.navigation

import android.app.Activity
import android.app.Application
import android.os.Bundle
import com.blankj.utilcode.util.ActivityUtils
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule
import xrn.modules.navigation.kotlin.Utils
import xrn.modules.navigation.kotlin.bean.NavigationStateHolder
import xrn.modules.navigation.reactnative.NavigationModule

class XRNNavigationModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), Application.ActivityLifecycleCallbacks {

    var isAppBlur = false

    override fun getName(): String {
        return "XRNNavigation"
    }

    override fun initialize() {
        super.initialize()
        this.reactContext.currentActivity?.application?.registerActivityLifecycleCallbacks(this)
    }

    override fun invalidate() {
        super.invalidate()
        this.reactContext.currentActivity?.application?.unregisterActivityLifecycleCallbacks(this)
    }

    @ReactMethod
    fun setNavigationKey(key: String) {
        getNavigationStateHolder()?.rnRootKey = key
    }

    @ReactMethod
    fun setNavigationState(state: String) {
        getNavigationStateHolder()?.rnRootState = state
    }

    @ReactMethod
    fun dispatchAction(action: String) {
        NavigationModule.dispatchAction(action)
    }

    @ReactMethod
    fun beforeAppCrash() {
        NavigationModule.beforeAppCrash()
    }

    @ReactMethod
    fun getCurrentModuleInfo(promise: Promise) {
        val state = getNavigationStateHolder()

        val result = state?.toReadableMap() ?: Arguments.createMap()

        promise.resolve(result)
    }

    // Required for rn built in EventEmitter Calls.
    @ReactMethod
    fun addListener(eventName: String?) {

    }

    @ReactMethod
    fun removeListeners(count: Int?) {

    }

    override fun onActivityCreated(activity: Activity, savedInstanceState: Bundle?) {

    }

    override fun onActivityStarted(activity: Activity) {

    }

    override fun onActivityResumed(activity: Activity) {
        if (activity != currentActivity) return

        onFocusChanged(true)

        isAppBlur = false
    }

    override fun onActivityPaused(activity: Activity) {
    }

    override fun onActivityStopped(activity: Activity) {
        if (activity != currentActivity) return

        val top = ActivityUtils.getTopActivity()

        isAppBlur = top == null || top == activity

        onFocusChanged(false)
    }

    override fun onActivitySaveInstanceState(activity: Activity, outState: Bundle) {

    }

    override fun onActivityDestroyed(activity: Activity) {

    }

    private fun onFocusChanged(focus: Boolean) {
        onFocusChangedInternal(focus)
    }

    private fun onFocusChangedInternal(focus: Boolean) {
        if (currentActivity == null || isAppBlur) {
            return
        }

        val navigationStateHolder = getNavigationStateHolder() ?: return

        val rootKey = navigationStateHolder.rnRootKey

        if (rootKey.isNullOrBlank()) return

        val event = if (focus) {
            "XT_SCREEN_APPEAR"
        } else {
            "XT_SCREEN_DISAPPEAR"
        }

        reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(event, navigationStateHolder.toReadableMap())
    }

    private fun getNavigationStateHolder(): NavigationStateHolder? {
        return Utils.getNavigationState(currentActivity)
    }

}