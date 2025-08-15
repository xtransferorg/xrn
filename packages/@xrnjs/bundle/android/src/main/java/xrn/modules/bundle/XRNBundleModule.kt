package xrn.modules.bundle

import com.blankj.utilcode.util.AppUtils
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableNativeArray
import com.facebook.react.bridge.WritableNativeMap
import com.google.gson.Gson
import xrn.modules.multibundle.bundle.BundleInfoManager
import xrn.modules.multibundle.bundle.RNHostManager
import xrn.modules.multibundle.view.RNContainerActivity
import kotlin.reflect.KMutableProperty

class XRNBundleModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

    private var mBundleName: String? = null

    private val GSON = Gson()

  override fun getName(): String {
    return NAME
  }

  @ReactMethod
  fun getCurBundleInfo(promise: Promise) {
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
  fun getBundleInfo(bundleName: String, promise: Promise) {
    val info = BundleInfoManager.getBundleInfo(bundleName)
    info?.let {
      val codePushInfo = getBundleInfo(reactApplicationContext, it)
      promise.resolve(convertCodePushInfo2Map(codePushInfo))
    } ?: run {
      promise.resolve("error:info is null, bundleName=${bundleName}")
    }

  }

  @ReactMethod
  fun getAllBundleInfos(promise: Promise) {
    val codePushInfoList = BundleInfoManager.getAllBundleInfo().map { info ->
      getBundleInfo(reactApplicationContext, info)
    }
    val codePushBundleInfoList = CodePushBundleInfoList(codePushInfoList)
    promise.resolve(convertCodePushBundleInfoList2Map(codePushBundleInfoList))
  }

  @ReactMethod
  fun preLoadBundle(bundleName: String, promise: Promise) {
    RNHostManager.preLoad(bundleName)
  }

  @ReactMethod
  fun reloadBundle(promise: Promise?) {
    AppUtils.relaunchApp(true)
    promise?.resolve(true)
  }



  @ReactMethod
  fun switchModule(bundleName: String, moduleName: String) {
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
  }

  @ReactMethod
  fun getBundleList(promise: Promise?) {
    val bundleInfoList = BundleInfoManager.getAllBundleInfo()
    val writeArray = WritableNativeArray()
    bundleInfoList.forEach {
      val bundleInfoMap = WritableNativeMap()
      bundleInfoMap.putString("bundleName", it.bundleName)
      bundleInfoMap.putString("port", it.getPort().toString())
      writeArray.pushMap(bundleInfoMap)
    }
    promise?.resolve(writeArray)
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
