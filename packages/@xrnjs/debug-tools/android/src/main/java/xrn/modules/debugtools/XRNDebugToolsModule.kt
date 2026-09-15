package xrn.modules.debugtools

import com.blankj.utilcode.util.ActivityUtils
import com.blankj.utilcode.util.LogUtils
import com.blankj.utilcode.util.SPUtils
import com.blankj.utilcode.util.ToastUtils
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.PromiseImpl
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableNativeArray
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.devsupport.ReactInstanceDevHelper
import xrn.modules.debugtools.action.CleanAppCacheAction
import xrn.modules.debugtools.action.MockCrashAction
import xrn.modules.debugtools.action.ReloadBundleAction
import xrn.modules.multibundle.bundle.BundleInfoManager
import xrn.modules.multibundle.devsupport.XDevSupportManager
import xrn.modules.multibundle.devsupport.XRNDevSupportManagerFactory
import xrn.modules.multibundle.devsupport.XRNDeveloperSettings
import xrn.modules.multibundle.devsupport.XRNPackageConnectionSettings
import xrn.modules.multibundle.view.RNContainerActivity

class XRNDebugToolsModule(reactContext: ReactApplicationContext) :
    NativeXRNDebugToolsModuleSpec(reactContext) {

    @ReactMethod
    override fun getBundleDebugConfig(bundleName: String, promise: Promise) {
        val bundleInfo = BundleInfoManager.getBundleInfo(bundleName)
        val devSettings = XRNDeveloperSettings.instance(bundleName)
        val config = Arguments.createMap()
        config.putString(
            "enableDebug",
            encodeBooleanOption(devSettings?.isBundleDebugEnabled())
        )
        config.putString(
            "enableCommon",
            encodeBooleanOption(devSettings?.isSplitBundleDebugEnabled(), true)
        )
        config.putString(
            "enableCodepush",
            encodeBooleanOption(devSettings?.isCodePushEnabled())
        )
        config.putInt("port", bundleInfo?.getPort() ?: 0)
        promise.resolve(config)
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    override fun setBundleDebugConfig(bundleName: String, config: ReadableMap): Boolean {
        XRNDeveloperSettings.instance(bundleName)?.run {
            setBundleDebugEnabled(decodeBooleanOption(config.getString("enableDebug")))
            setSplitBundleDebugEnabled(decodeBooleanOption(config.getString("enableCommon"), true))
            setCodePushEnabled(decodeBooleanOption(config.getString("enableCodepush")))
            setDebugServerPort(config.getDouble("port").toInt())
        }
        return true
    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    override fun registerDevBundle(bundleName: String, portStr: String?): Boolean {
        val port = if (portStr.isNullOrBlank()) {
            0
        } else {
            portStr.toInt()
        }

        if (BundleInfoManager.isBundleRegistered(bundleName)) {
            BundleInfoManager.getBundleInfo(bundleName)?.setPort(port)
        } else {
            BundleInfoManager.registerDevBundle(bundleName, port)
        }

        XRNDeveloperSettings.instance(bundleName)?.run {
            setBundleDebugEnabled(true)
            setSplitBundleDebugEnabled(true)
        }
        return true
    }

    /**
     * 获取 SP 值
     */
    @ReactMethod(isBlockingSynchronousMethod = true)
    override fun getNativeStorageSync(spName: String?, key: String?): String {
        return if (key.isNullOrBlank()) {
            ""
        } else {
            val value = SPUtils.getInstance(spName ?: "").getString(key)
            value ?: ""
        }
    }

    /**
     * 设置 SP 值
     */
    @ReactMethod(isBlockingSynchronousMethod = true)
    override fun setNativeStorageSync(spName: String?, key: String?, value: String?): Boolean {
        return if (key.isNullOrBlank()) {
            false
        } else {
            SPUtils.getInstance(spName ?: "").put(key, value, true)
            true
        }
    }

    /**
     * 清除缓存
     */
    @ReactMethod
    override fun cleanAppCache(promise: Promise) {
        currentActivity?.let {
            CleanAppCacheAction(it).doAction()
            promise.resolve(true)
        } ?: {
            ToastUtils.showShort("currentActivity is null")
            promise.resolve(false)
        }

    }

    /**
     * 重新加载bundle
     */
    @ReactMethod
    override fun reloadBundle(promise: Promise) {
        currentActivity?.let {
            ReloadBundleAction(it as? RNContainerActivity).doAction()
            promise.resolve(true)
        } ?: {
            ToastUtils.showShort("currentActivity is null")
            promise.resolve(false)
        }
    }

    @ReactMethod
    override fun toggleInspector(promise: Promise) {
        val host = (currentActivity as? RNContainerActivity)?.reactHost
        val devSupportManager: XDevSupportManager? =
            host?.devSupportManager as? XDevSupportManager
        val reactInstanceDevHelper: ReactInstanceDevHelper? =
            devSupportManager?.reactInstanceDevHelper
        reactInstanceDevHelper?.toggleElementInspector()
    }

    @ReactMethod
    override fun getInspectorIsShown(promise: Promise) {
        val host = (currentActivity as? RNContainerActivity)?.reactHost
        val devSettings = host?.devSupportManager?.devSettings
        return promise.resolve(devSettings?.isElementInspectorEnabled ?: false)
    }

    @ReactMethod
    override fun togglePerfMonitor(promise: Promise) {
        val host = (currentActivity as? RNContainerActivity)?.reactHost
        val devSettings =
            host?.devSupportManager?.devSettings as? XRNDeveloperSettings
        if (devSettings != null) {
            devSettings.isFpsDebugEnabled = !devSettings.isFpsDebugEnabled
        }
    }

    @ReactMethod
    override fun getPerfMonitorIsShown(promise: Promise) {
        val host = (currentActivity as? RNContainerActivity)?.reactHost
        val devSettings =
            host?.devSupportManager?.devSettings as? XRNDeveloperSettings
        promise.resolve(devSettings?.isFpsDebugEnabled ?: false)
    }

    @ReactMethod
    override fun toggleMemoryLeak(promise: Promise) {
        // noop placeholder
        promise.resolve(true)
    }

    @ReactMethod
    override fun getMemoryLeakIsShown(promise: Promise) {
        // noop placeholder
        promise.resolve(false)
    }

    override fun pingStart(host: String?, promise: Promise?) {

    }

    override fun dnsStart(host: String?, promise: Promise?) {

    }

    override fun proxyInfo(url: String?, promise: Promise?) {

    }

    /**
     * 获取所有 bundle 信息
     */
    @ReactMethod
    override fun getAllBundlesDataSync(promise: Promise) {
        val writableArray = WritableNativeArray()
        val bundleInfoList = BundleInfoManager.getAllBundleInfo()
        //过滤 xt-app-debug 和 xt-app-marketing
        bundleInfoList.forEach {
            val map = WritableNativeMap()
            map.putString("bundleName", it.bundleName)
            writableArray.pushMap(map)
        }
        promise.resolve(writableArray)
    }

    @ReactMethod
    override fun nativeCrash(promise: Promise?) {
        MockCrashAction().doAction()
        promise?.resolve(true)
    }

    @ReactMethod
    override fun routeInfo(promise: Promise?) {
        val writableArray = WritableNativeArray()
        val list = ActivityUtils.getActivityList()
        list.reverse()
        list.forEach {
            val map = WritableNativeMap()
            if (it !is RNContainerActivity) {
                map.putString("bundleName", it.javaClass.simpleName)
            } else {
                val bundleName = it.getBundleName()
                val moduleName = it.getModuleName()
                if (moduleName == "xt-app-debug") {
                    return@forEach
                }
                map.putString("bundleName", bundleName)
                map.putString("moduleName", moduleName)
            }
            writableArray.pushMap(map)
        }
        promise?.resolve(writableArray)

    }

    @ReactMethod(isBlockingSynchronousMethod = true)
    override fun getBundleHostIPSync(): String {
        val sp = XRNPackageConnectionSettings.getDebugPreferences(reactApplicationContext)
        val ip = sp.getString(XRNPackageConnectionSettings.PREFS_DEBUG_SERVER_IP_KEY, "") ?: ""
        return ip;
    }

    @ReactMethod
    override fun setBundleHostIP(host: String?): Boolean {
        val sp = XRNPackageConnectionSettings.getDebugPreferences(reactApplicationContext)
        sp.edit().putString(XRNPackageConnectionSettings.PREFS_DEBUG_SERVER_IP_KEY, host).apply()
        return true
    }

    @ReactMethod
    override fun openConnection(host: String, port: String, room: String): Boolean {
        val promise = PromiseImpl(null, null)
        val visulation = DataHost.getVisulationInstance?.invoke()
        LogUtils.d("连接参数", host, port, room, visulation)
        if (visulation != null) {
            visulation.initConnection(currentActivity, host, port, room, promise)
        } else {
            promise.reject("10001", "没有IVisulation实现，请查看apk是否为local渠道包")
        }
        return true
    }

    companion object {
        const val NAME = "XRNDebugToolsModule"

        fun encodeBooleanOption(value: Boolean?, default: Boolean = false): String {
            return if (value ?: default) "1" else "0"
        }

        fun decodeBooleanOption(value: String?, default: Boolean = false): Boolean {
            return when (value) {
                "1" -> true
                "0" -> false
                else -> default
            }
        }
    }

}
