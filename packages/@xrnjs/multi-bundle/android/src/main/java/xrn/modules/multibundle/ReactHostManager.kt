package xrn.modules.multibundle

import android.app.Application
import com.blankj.utilcode.util.ActivityUtils
import com.facebook.react.ReactHost
import xrn.modules.multibundle.bundle.BundleInfoManager
import xrn.modules.multibundle.runtime.XRNReactHostDelegate
import xrn.modules.multibundle.runtime.XRNReactHostImpl
import xrn.modules.multibundle.runtime.getReactHostDelegate
import xrn.modules.multibundle.runtime.pool.XRNReactHostPool
import xrn.modules.multibundle.view.RNContainerActivity

object ReactHostManager {

    @Volatile
    private var isInitialized: Boolean = false
    private lateinit var application: Application

    private val reactHostsLock = Any()
    private val reactHosts = mutableMapOf<String, XRNReactHostImpl>()

    fun init(application: Application) {
        assert(!isInitialized) { "ReactHostManager has initialized." }
        assert(application is XRNApplication) { "application must be an instance of XRNApplication." }

        this.application = application
    }

    fun current(): XRNReactHostImpl {
        val topActivity = ActivityUtils.getTopActivity()
        if (topActivity is RNContainerActivity) {
            return getOrCreate(topActivity.getBundleName())
        }

        return getDefault()
    }

    fun getDefault(): XRNReactHostImpl {
        return getOrCreate(BundleInfoManager.getMainBundleInfo().bundleName)
    }

    fun getOrCreate(bundleName: String): XRNReactHostImpl =
        synchronized(reactHostsLock) {
            reactHosts[bundleName]?.let { return it }

            val reactHost = create(bundleName)
            reactHosts[bundleName] = reactHost
            return reactHost
        }

    fun create(bundleName: String): XRNReactHostImpl {
        return getReactHostPool().newInstance(bundleName)
    }

    fun all(): List<ReactHost> =
        synchronized(reactHostsLock) {
            return reactHosts.values.toList()
        }

    fun isBundleRegistered(bundleName: String): Boolean =
        BundleInfoManager.isBundleRegistered(bundleName)

    fun getReactHostDelegate(bundleName: String): XRNReactHostDelegate {
        return getOrCreate(bundleName).getReactHostDelegate()
    }

    fun getReactHostPool(): XRNReactHostPool {
        return (application as XRNApplication).reactHostPool
    }

    fun preLoad(bundleName: String?): Boolean {
        if (bundleName.isNullOrEmpty() || !isBundleRegistered(bundleName)) {
            return false
        }

        getReactHostPool().preCreate(bundleName)

        return true
    }

    fun release(bundleName: String?): Boolean {
        if (bundleName.isNullOrEmpty() || !isBundleRegistered(bundleName)) {
            return false
        }

        getReactHostPool().release(bundleName)

        return true
    }

    fun releaseForce(bundleName: String?): Boolean {
        if (bundleName.isNullOrEmpty() || !isBundleRegistered(bundleName)) {
            return false
        }

        getReactHostPool().releaseForce(bundleName)

        return true
    }

    fun reload(bundleName: String?): Boolean {
        if (bundleName.isNullOrEmpty() || !isBundleRegistered(bundleName)) {
            return false
        }

        getReactHostPool().reload(bundleName)

        return true
    }

    fun reloadForce(bundleName: String?): Boolean {
        if (bundleName.isNullOrEmpty() || !isBundleRegistered(bundleName)) {
            return false
        }

        getReactHostPool().reloadForce(bundleName)

        return true
    }

}