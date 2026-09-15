package xrn.modules.navigation

import android.app.Activity
import android.app.Application
import android.os.Bundle
import android.util.Log
import com.blankj.utilcode.util.ActivityUtils
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.modules.core.DeviceEventManagerModule
import xrn.modules.navigation.kotlin.Utils
import xrn.modules.navigation.kotlin.bean.NavigationStateHolder
import xrn.modules.navigation.reactnative.NavigationModule

@ReactModule(name = XRNNavigationModule.NAME)
class XRNNavigationModule(private val reactContext: ReactApplicationContext) :
    NativeXRNNavigationModuleSpec(reactContext), Application.ActivityLifecycleCallbacks {

    companion object {
        const val NAME = "XRNNavigation"
    }

    var isAppBlur = false

    override fun getName(): String {
        return NAME
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
    override fun setNavigationKey(key: String): Boolean {
        getNavigationStateHolder()?.rnRootKey = key
        return true
    }

    @ReactMethod
    override fun setNavigationState(state: String): Boolean {
        getNavigationStateHolder()?.rnRootState = state
        return true
    }

    @ReactMethod
    override fun dispatchAction(action: String, promise: Promise) {
        // 使用安全的方式获取 Activity，避免多线程环境下的竞态条件
        val activity = currentActivity
        if (activity == null) {
            Log.e(NAME, "dispatchAction failed: currentActivity is null, action: $action")
            // Activity 为空可能是因为应用在后台、正在销毁或未完全初始化
            return
        }

        NavigationModule.dispatchAction(activity, action)
        promise.resolve(true)
    }

    @ReactMethod
    override fun getCurrentModuleInfo(promise: Promise) {
        val state = getNavigationStateHolder()

        val result = state?.toReadableMap() ?: Arguments.createMap()

        promise.resolve(result)
    }

    @ReactMethod
    override fun setShouldInterceptSideSwipe(shouldIntercept: Boolean, routeKey: String?): Boolean {
        // Android No-op
        return true
    }

    @ReactMethod
    override fun confirmShouldSideSwipePop(): Boolean {
        // Android No-op
        return true
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