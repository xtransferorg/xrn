package xrn.modules.multibundle.view

import android.content.Intent
import android.os.Bundle
import com.blankj.utilcode.util.LogUtils
import com.blankj.utilcode.util.ReflectUtils
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.ReactHost
import xrn.modules.multibundle.bundle.BundleInfoManager
import xrn.modules.multibundle.runtime.XRNReactApplication
import xrn.modules.multibundle.runtime.pool.XRNReactHostPool
import java.lang.ref.WeakReference


open class RNContainerActivity : ReactActivity() {

    companion object {
        const val BUNDLE_PARAMS = "bundle"
        const val BUNDLE_NAME_PARAMS = "bundleName"
        const val MODULE_NAME_PARAMS = "moduleName"
    }

    private var mBundleName: String = ""
    private var mModuleName: String = ""

    private val mDefaultBundleParams by lazy { getDefaultBundleParams() }

    override fun onCreate(savedInstanceState: Bundle?) {
        initData(intent)
        super.onCreate(null)
        getReactHostPool()?.onRootViewAttach(mBundleName)
    }

    override fun onResume() {
        super.onResume()

        // 如果在其他 bundle reload 当前 bundle，第一次进入 bundle onResume 无法设置新的 Activity。
        trySetCurrentActivity()
    }

    private fun trySetCurrentActivity() {
        val currentReactContext = this.reactHost.currentReactContext ?: return
        if (currentReactContext.hasCurrentActivity()) return

        try {
            ReflectUtils.reflect(currentReactContext)
                .field("mCurrentActivity", WeakReference(this))
        } catch (e: ReflectUtils.ReflectException) {
            LogUtils.e(e)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        getReactHostPool()?.onRootViewDetach(mBundleName)
    }

    override fun getMainComponentName(): String {
        val bundle = getBundleParams()
        return bundle.getString(MODULE_NAME_PARAMS) ?: bundle.getString(BUNDLE_NAME_PARAMS) ?: ""
    }

    override fun createReactActivityDelegate(): ReactActivityDelegate {
        return object : ReactActivityDelegate(this, null) {
            override fun getMainComponentName(): String {
                return this@RNContainerActivity.getMainComponentName()
            }

            override fun getLaunchOptions(): Bundle {
                return getBundleParams()
            }
        }
    }

    open fun initData(intent: Intent?) {
        initializeBundleParams()
    }

    protected open fun initializeBundleParams() {
        getBundleParams().let {
            mBundleName = it.getString(BUNDLE_NAME_PARAMS, getDefaultBundleName())
            mModuleName = it.getString(MODULE_NAME_PARAMS, getDefaultModuleName())
        }
    }

    private fun getBundleParams(): Bundle {
        return intent?.getBundleExtra(BUNDLE_PARAMS) ?: mDefaultBundleParams
    }

    protected open fun getDefaultBundleParams(): Bundle {
        val bundle = Bundle()
        bundle.putString(BUNDLE_NAME_PARAMS, getDefaultBundleName())
        bundle.putString(MODULE_NAME_PARAMS, getDefaultModuleName())
        return bundle
    }

    private fun getDefaultBundleName(): String {
        return BundleInfoManager.getMainBundleInfo()?.bundleName ?: ""
    }

    private fun getDefaultModuleName(): String? {
        val defaultModuleName = BundleInfoManager.getMainBundleInfo()?.defaultModuleName
        return if (defaultModuleName.isNullOrBlank()) {
            getDefaultBundleName()
        } else {
            defaultModuleName
        }
    }

    fun getBundleName(): String {
        return mBundleName
    }

    fun getModuleName(): String {
        return mModuleName
    }

    public override fun getReactHost(): ReactHost {
        return super.getReactHost()
    }

    private fun getReactHostPool(): XRNReactHostPool? {
        if (application is XRNReactApplication) {
            return (application as XRNReactApplication).reactHostPool
        }

        return null
    }

    override fun onTrimMemory(level: Int) {
        super.onTrimMemory(level)
        // TODO 主动回收
        if (level >= TRIM_MEMORY_UI_HIDDEN) {

        }

        if (level >= TRIM_MEMORY_BACKGROUND) {

        }
    }

}