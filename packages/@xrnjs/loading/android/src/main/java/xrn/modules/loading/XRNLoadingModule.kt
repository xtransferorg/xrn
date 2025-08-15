package xrn.modules.loading

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod


class XRNLoadingModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return NAME
    }

    /**
     * 打开启动屏
     */
    @ReactMethod
    fun show() {
        LoadingManager.showSplash(currentActivity)
    }

    /**
     * 关闭启动屏
     */
    @ReactMethod
    fun hide() {
        LoadingManager.hideSplash(currentActivity)
    }

    @ReactMethod
    fun showLoading() {
        LoadingManager.showLoading(currentActivity)
    }

    @ReactMethod
    fun hideLoading() {
        LoadingManager.hideLoading(currentActivity)
    }

    @ReactMethod
    fun updateProgress(progress: Int) {
        LoadingManager.updateProgress(currentActivity, progress)
    }

    companion object {
        const val NAME = "XRNLoadingModule"
    }

}
