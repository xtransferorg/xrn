package xrn.modules.loading

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod


class XRNLoadingModule(reactContext: ReactApplicationContext) :
    NativeXRNLoadingModuleSpec(reactContext) {

    override fun getName(): String {
        return NAME
    }

    /**
     * 打开启动屏
     */
    @ReactMethod
    override fun show(): Boolean {
        LoadingManager.showSplash(currentActivity, true)
        return true
    }

    /**
     * 关闭启动屏
     */
    @ReactMethod
    override fun hide(): Boolean {
        LoadingManager.hideSplash(currentActivity)
        return true
    }

    @ReactMethod
    override fun showLoading(): Boolean {
        LoadingManager.showLoading(currentActivity)
        return true
    }

    @ReactMethod
    override fun hideLoading(): Boolean {
        LoadingManager.hideLoading(currentActivity)
        return true
    }

    @ReactMethod
    override fun updateProgress(progress: Double): Boolean {
        LoadingManager.updateProgress(currentActivity, progress.toInt(), false)
        return true
    }

    companion object {
        const val NAME = "XRNLoadingModule"
    }

}
