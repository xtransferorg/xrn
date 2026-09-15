package xrn.modules.bundle

import com.blankj.utilcode.util.AppUtils
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableNativeArray
import com.facebook.react.bridge.WritableNativeMap
import xrn.modules.multibundle.ReactHostManager
import xrn.modules.multibundle.bundle.BundleInfoManager
import xrn.modules.multibundle.view.RNContainerActivity


class XRNBundleModule(reactContext: ReactApplicationContext) :
    NativeXRNBundleModuleSpec(reactContext) {
    private var mBundleName: String? = null

    private var mMainBundleName: String? = null
    private var mMainModuleName: String? = null

    init {
        BundleInfoManager.getMainBundleInfo()?.let {
            mMainBundleName = it.bundleName
            mMainModuleName = it.defaultModuleName
        }
    }

    override fun getName(): String {
        return NAME
    }

    override fun getConstants(): Map<String?, Any?> {
        return mapOf(
            "mainBundleName" to mMainBundleName,
            "mainModuleName" to mMainModuleName
        )
    }

    @ReactMethod
    override fun getCurBundleInfo(promise: Promise) {
        checkParamsValid("getCurBundleInfo")
        val info = BundleInfoManager.getBundleInfo(mBundleName)
        info?.let {
            val codePushInfo = getBundleInfo(reactApplicationContext, info)
            promise.resolve(convertCodePushInfo2Map(codePushInfo))
        } ?: run {
            promise.resolve("error:info is null, bundleName=${mBundleName}")
        }
    }

    @ReactMethod
    override fun getBundleInfo(bundleName: String, promise: Promise) {
        val info = BundleInfoManager.getBundleInfo(bundleName)
        info?.let {
            val codePushInfo = getBundleInfo(reactApplicationContext, it)
            promise.resolve(convertCodePushInfo2Map(codePushInfo))
        } ?: run {
            promise.resolve("error:info is null, bundleName=${bundleName}")
        }

    }

    @ReactMethod
    override fun getAllBundleInfos(promise: Promise) {
        val codePushInfoList = BundleInfoManager.getAllBundleInfo().map { info ->
            getBundleInfo(reactApplicationContext, info)
        }
        val codePushBundleInfoList = CodePushBundleInfoList(codePushInfoList)
        promise.resolve(convertCodePushBundleInfoList2Map(codePushBundleInfoList))
    }

    @ReactMethod
    override fun getBundleList(promise: Promise?) {
        val nativeWriteArray = WritableNativeArray()
        BundleInfoManager.getAllBundleInfo().forEach {
            val bundleInfoMap = WritableNativeMap().apply {
                putString("bundleName", it.bundleName)
                putString("port", "${it.getPort()}")
            }
            nativeWriteArray.pushMap(bundleInfoMap)
        }
        promise?.resolve(nativeWriteArray)
    }

    override fun preLoadBundle(bundleName: String?): Boolean {
        ReactHostManager.preLoad(bundleName)
        return true
    }

    override fun releaseBundle(bundleName: String?): Boolean {
        ReactHostManager.release(bundleName)
        return true
    }

    override fun releaseBundleForce(bundleName: String?): Boolean {
        ReactHostManager.releaseForce(bundleName)
        return true
    }

    override fun releaseAllBundle(options: ReadableMap?): Boolean {
        val excludeBundles = ReleaseAllBundlesOptions.from(options).excludeBundles

        BundleInfoManager.getAllBundleInfo().forEach {
            if (excludeBundles != null && excludeBundles.contains(it.bundleName)) {
                return@forEach
            }

            ReactHostManager.releaseForce(it.bundleName)
        }
        return true
    }

    override fun reloadBundleByName(bundleName: String?): Boolean {
        ReactHostManager.reload(bundleName)
        return true
    }

    override fun reloadBundleForceByName(bundleName: String?): Boolean {
        ReactHostManager.reloadForce(bundleName)
        return true
    }

    override fun preloadCommonEnabled(enabled: Boolean): Boolean {
        // TODO Android No-op
        return true
    }

    override fun preloadBundleEnabled(enabled: Boolean): Boolean {
        // TODO Android No-op
        return true
    }

    override fun reloadBundle(): Boolean {
        AppUtils.relaunchApp(true)
        return true
    }

    @ReactMethod
    override fun switchModule(bundleName: String, moduleName: String): Boolean {
//    if (currentActivity == null) return
//    val rootView = (this.currentActivity as RNContainerActivity).getRootView()
//    rootView?.let {
//      try {
//        val reactRootViewClass = it::class
//        val properties = reactRootViewClass.members
//        properties.forEach { property ->
//          when (property.name) {
//            "mJSModuleName" -> {
//              if (property is KMutableProperty<*>) {
//                property.isAccessible = true
//                property.setter.call(it, moduleName)
//              }
//            }
//          }
//        }
//        it.appProperties = NavHelper.buildModuleParams(bundleName, moduleName)
//        it.runApplication()
//      } catch (e: NoSuchFieldException) {
//        e.printStackTrace()
//      } catch (e: IllegalAccessException) {
//        e.printStackTrace()
//      }
//    }
        return true
    }

    override fun preDownloadCodePush(bundleNames: ReadableArray, promise: Promise?) {
        for (i in 0..<bundleNames.size()) {
            val name = bundleNames.getString(i)
            if (name != null) {
                CodePushInstanceManager.preDownload(name)
            }
        }

        promise?.resolve(true)
    }

    @ReactMethod
    override fun reportCodePushProgressShown(promise: Promise?) {
        CodePushInstanceManager.reportProgressShown()
        promise?.resolve(null)
    }

    private fun checkParamsValid(method: String) {
        if (mBundleName.isNullOrEmpty()) {
            if (currentActivity is RNContainerActivity) {
                mBundleName = (currentActivity as RNContainerActivity).getBundleName()
            }
        }
        if (mBundleName.isNullOrEmpty()) {
            throw IllegalArgumentException("$NAME.$method: invalid params, mBundleName=$mBundleName")
        }
    }


    companion object {
        const val NAME = "XRNBundleModule"
    }
}
