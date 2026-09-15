package xrn.modules.multibundle.runtime

import android.app.Application
import com.facebook.react.bridge.JSBundleLoader
import com.facebook.react.bridge.JSBundleLoaderDelegate
import xrn.modules.multibundle.runtime.JSBundleLoaderListener
import java.util.concurrent.CountDownLatch

open class XRNJSBundleLoader(
    open val application: Application,
    open var bundleName: String,
    open var loadCommonOnly: Boolean,
    open val jsBundleFileHolder: JSBundleFileHolder,
) : JSBundleLoader() {
    private val loadBizLatch = CountDownLatch(1)

    @Volatile
    private var mJSBundleLoaderListener: JSBundleLoaderListener? = null

    fun setJSBundleLoaderListener(listener: JSBundleLoaderListener?) {
        this.mJSBundleLoaderListener = listener
    }

    fun resumeLoadBizBundleIfNeeded() {
        if (loadCommonOnly) {
            loadCommonOnly = false
            loadBizLatch.countDown()
        }
    }

    override fun loadScript(delegate: JSBundleLoaderDelegate): String {
        loadCommonBundleInternal(delegate)

        if (loadCommonOnly) {
            try {
                loadBizLatch.await()
            } catch (e: InterruptedException) {
                onLoadFail(JSBundleType.BIZ, e)
                return ""
            }
        }

        return loadBizBundleInternal(delegate)
    }

    private fun loadCommonBundleInternal(delegate: JSBundleLoaderDelegate): String {
        onLoadStart(JSBundleType.COMMON)
        val sourceUrl = loadCommonBundle(delegate)
        onLoadEnd(JSBundleType.COMMON)
        return sourceUrl
    }

    private fun loadBizBundleInternal(delegate: JSBundleLoaderDelegate): String {
        onLoadStart(JSBundleType.BIZ)
        val sourceUrl = loadBizBundle(delegate)
        onLoadEnd(JSBundleType.BIZ)
        return sourceUrl
    }

    protected open fun loadCommonBundle(delegate: JSBundleLoaderDelegate): String {
        val sourceUrl = loadScript(delegate, getBundleFile(JSBundleType.COMMON))
        return sourceUrl
    }

    protected open fun loadBizBundle(delegate: JSBundleLoaderDelegate): String {
        val sourceUrl = loadScript(delegate, getBundleFile(JSBundleType.BIZ))
        return sourceUrl
    }

    protected fun loadScript(delegate: JSBundleLoaderDelegate, jsBundleFile: String?): String {
        if (jsBundleFile.isNullOrBlank()) return ""

        if (jsBundleFile.startsWith(ASSETS_PREFIX)) {
            delegate.loadScriptFromAssets(application.assets, jsBundleFile, false)
        } else {
            delegate.loadScriptFromFile(jsBundleFile, jsBundleFile, false)
        }
        return jsBundleFile
    }

    protected fun getBundleFile(bundleType: JSBundleType): String {
        return jsBundleFileHolder.getJSBundleFile(bundleType)
    }

    protected open fun onLoadStart(bundleType: JSBundleType, bundleName: String = this.bundleName) {
        mJSBundleLoaderListener?.onLoadStart(bundleName, loadCommonOnly, bundleType)
    }

    protected open fun onLoadEnd(bundleType: JSBundleType, bundleName: String = this.bundleName) {
        mJSBundleLoaderListener?.onLoadEnd(bundleName, loadCommonOnly, bundleType)
    }

    protected open fun onLoadFail(bundleType: JSBundleType, error: Throwable) {
        mJSBundleLoaderListener?.onLoadFail(this.bundleName, loadCommonOnly, bundleType, error)
    }

    companion object {
        const val ASSETS_PREFIX = "assets://"
    }

}