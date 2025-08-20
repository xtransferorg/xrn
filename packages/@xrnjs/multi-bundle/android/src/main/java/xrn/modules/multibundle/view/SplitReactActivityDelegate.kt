package xrn.modules.multibundle.view

import android.os.Bundle
import com.blankj.utilcode.util.LogUtils
import com.blankj.utilcode.util.ReflectUtils
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.ReactDelegate
import xrn.modules.multibundle.bundle.RNHost
import xrn.modules.multibundle.bundle.RNHostManager
import xrn.modules.multibundle.bundle.core.BundleMarker

/**
 * LoadApp for split bundles
 */
abstract class SplitReactActivityDelegate(activity: ReactActivity) :
    ReactActivityDelegate(activity, null) {

    /**
     * bundle name
     */
    private val bundleName: String
        get() = getBizBundleName()

    /**
     * module name
     */
    private val moduleName: String
        get() = getBizModuleName()

    /**
     * Callback for bundle load completion
     */
    private val reactBundleListener = object : BundleMarker.BundleListener {
        override fun onRunJSBundleEnd() {
            val react = getReactDelegate()
            //When react.reactRootView is null, the first-time loadApp scenario.
            if (react.reactRootView == null) {
                loadApp(moduleName)
            } else {
                // In special cases, an assertion error may occur:
                // Assertions.assertCondition(this.mReactInstanceManager == null, "This root view has already been attached to a catalyst instance manager");
                // Scenario: If the user taps quickly to launch the same bundle twice, two ReactRootViews are created.
                // Both have a non-null mReactInstanceManager due to calling startReactApplication.
                // However, the first Activity does not render the UI (attachRootViewToInstance is not called),
                // and ReactInstanceManager#mAttachedReactRoots only contains the ReactRootView of the second Activity.
                // During a mandatory CodePush update, only the second ReactRootView's unmountReactApplication gets called.
                // When recreating the ReactContext, the first page's startApplication call throws an error.
                // To resolve this, we manually call unmountReactApplication here.
                if (react.reactRootView.reactInstanceManager != null) {
                    react.reactRootView.unmountReactApplication()
                }
                // When reloading, if the ReactRootView is already attached to a ReactInstanceManager,
                // calling loadApp directly will result in an error.
                // To handle this properly, we manually invoke startReactApplication instead.
                react.reactRootView.startReactApplication(
                    reactInstanceManager,
                    moduleName,
                    getLaunchOptions()
                )
                react.reactRootView.requestLayout()
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        if (reactNativeHost is RNHost && (reactNativeHost as RNHost).isSplitMode()) {
            BundleMarker.addListener(bundleName, reactBundleListener)
            if (RNHostManager.getBundleStateWrapper(bundleName)?.isBundleLoaded() == true) {
                // If the business bundle has already been loaded, call loadApp directly
                loadApp(moduleName)
            } else {
                // Call loadApp in the [onRunJSBundleEnd] callback
                reactInstanceManager.createReactContextInBackground()
            }
        } else {
            // SplitBundle is not enabled, load the business bundle directly
            loadApp(moduleName)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        BundleMarker.removeListener(bundleName, reactBundleListener)
    }

    /**
     * Get the name of the business bundle
     */
    abstract fun getBizBundleName(): String

    /**
     * Get the name of the business module
     */
    abstract fun getBizModuleName(): String


    private fun getReactDelegate(): ReactDelegate {
        return ReflectUtils.reflect(this).field("mReactDelegate").get()
    }
}