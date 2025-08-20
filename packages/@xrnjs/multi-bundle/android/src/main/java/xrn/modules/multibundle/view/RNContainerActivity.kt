package xrn.modules.multibundle.view

import android.content.Intent
import android.os.Bundle
import com.blankj.utilcode.util.ToastUtils
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.ReactDelegate
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactRootView
import xrn.modules.multibundle.bundle.RNHost
import xrn.modules.multibundle.bundle.RNHostManager
import java.lang.reflect.Field

open class RNContainerActivity: ReactActivity() {

    companion object {
        // Key for passing bundle-related parameters via Intent
        const val BUNDLE_PARAMS = "bundle"
        const val BUNDLE_NAME_PARAMS = "bundleName"
        const val MODULE_NAME_PARAMS = "moduleName"
    }

    /**
     * Name of the JS bundle to load
     */
    protected var mBundleName: String = ""

    /**
     * Name of the JS module registered in JavaScript
     */
    protected var mModuleName: String = ""

    /**
     * Custom ReactActivityDelegate for handling split bundle logic
     */
    protected lateinit var mRNDelegate: SplitReactActivityDelegate

    override fun onCreate(savedInstanceState: Bundle?) {
        initData(intent)
        super.onCreate(null)
        getRNHost()

    }

    override fun createReactActivityDelegate(): ReactActivityDelegate {
        mRNDelegate = object : SplitReactActivityDelegate(this) {
            override fun getReactNativeHost(): ReactNativeHost? {
                return getRNHost()
            }

            override fun getBizBundleName(): String {
                return mBundleName
            }

            override fun getBizModuleName(): String {
                return mModuleName
            }

            override fun getLaunchOptions(): Bundle? {
                return intent.getBundleExtra(BUNDLE_PARAMS)
            }
        }
        return mRNDelegate
    }

    /**
     * Utility to retrieve ReactRootView via reflection (for debugging or lifecycle purposes)
     */
    fun getRootView(): ReactRootView? {
        try {
            val field: Field = ReactActivityDelegate::class.java.getDeclaredField("mReactDelegate")
            field.isAccessible = true
            val reactDelegateValue = field.get(mRNDelegate) as ReactDelegate
            return reactDelegateValue.reactRootView
        } catch (e: NoSuchFieldException) {
            e.printStackTrace()
        } catch (e: IllegalAccessException) {
            e.printStackTrace()
        }
        return null
    }

    /**
     * Extract bundle and module info from the incoming Intent
     */
    open fun initData(intent: Intent?) {
        intent?.getBundleExtra(BUNDLE_PARAMS)?.let {
            mBundleName = it.getString(BUNDLE_NAME_PARAMS) ?: ""
            mModuleName = it.getString(MODULE_NAME_PARAMS) ?: ""
        } ?: kotlin.run {
            mBundleName = ""
            mModuleName = ""
        }
    }

    /**
     * Get the bundle name
     */
    fun getBundleName(): String {
        return mBundleName
    }

    /**
     * Get the module name
     */
    fun getModuleName(): String {
        return mModuleName
    }

    /**
     * Retrieve RNHost instance by bundleName
     */
    fun getRNHost(): RNHost? {
        return if (mBundleName.isEmpty()) {
            null
        } else {
            RNHostManager.getOrCreateRNHostByBundle(mBundleName)
        }
    }

    /**
     * Determine if the current bundle is the main bundle
     */
    fun isMainBundle(): Boolean {
        return getRNHost()?.bundleInfo?.isMainBundle() ?: false
    }
}