package xrn.modules.debugtools

import android.preference.PreferenceManager
import com.blankj.utilcode.util.ActivityUtils
import com.blankj.utilcode.util.LogUtils
import com.blankj.utilcode.util.SPUtils
import com.blankj.utilcode.util.ToastUtils
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.WritableNativeArray
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.devsupport.ReactInstanceDevHelper
import xrn.modules.debugtools.action.CleanAppCacheAction
import xrn.modules.debugtools.action.MockCrashAction
import xrn.modules.debugtools.action.QRCodeScanAction
import xrn.modules.debugtools.action.ReloadBundleAction
import xrn.modules.multibundle.bundle.BundleInfoManager
import xrn.modules.multibundle.devsupport.XDevInternalSettings
import xrn.modules.multibundle.devsupport.XDevSupportManager
import xrn.modules.multibundle.devsupport.XPackageConnectionSettings
import xrn.modules.multibundle.view.RNContainerActivity

class XRNDebugToolsModuleModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String {
    return NAME
  }

  /**
   * bundle是否开启调试
   * 同步方法
   */
  @ReactMethod(isBlockingSynchronousMethod = true)
  fun isBundleDebugSync(bundleName: String): Boolean {
    return XDevInternalSettings.instance(bundleName)?.isBundleDebugEnabled() ?: false
  }

  /**
   * 设置bundle是否开启调试
   * 同步方法
   */
  @ReactMethod(isBlockingSynchronousMethod = true)
  fun setBundleDebugSync(bundleName: String, isDebug: Boolean): Boolean {
    XDevInternalSettings.instance(bundleName)?.setBundleDebugEnabled(isDebug)
    return true
  }

  @ReactMethod(isBlockingSynchronousMethod = true)
  fun isSplitBundleEnabled(bundleName: String): Boolean {
    return XDevInternalSettings.instance(bundleName)?.isSplitBundleDebugEnabled() ?: false
  }

  @ReactMethod(isBlockingSynchronousMethod = true)
  fun setSplitBundleEnabled(bundleName: String, enabled: Boolean): Boolean {
    XDevInternalSettings.instance(bundleName)?.setSplitBundleDebugEnabled(enabled)
    return true
  }

  /**
   * 获取 SP 值
   */
  @ReactMethod(isBlockingSynchronousMethod = true)
  fun getNativeStorageSync(spName: String?, key: String?): String {
    return if (key.isNullOrBlank()) {
      ""
    } else {
      val value = SPUtils.getInstance(spName?: "").getString(key)
      value ?: ""
    }
  }

  /**
   * 设置 SP 值
   */
  @ReactMethod(isBlockingSynchronousMethod = true)
  fun setNativeStorageSync(spName: String?, key: String?, value: String?): Boolean {
    return if (key.isNullOrBlank()) {
      false
    } else {
      SPUtils.getInstance(spName?: "").put(key, value, true)
      true
    }
  }

  /**
   * 打开二维码扫描
   */
  @ReactMethod
  fun openScanQR(promise: Promise) {
    currentActivity?.let {
      val action = QRCodeScanAction(it)
      action.doAction()
      promise.resolve(true)
    } ?: {
      ToastUtils.showShort("currentActivity is null")
      promise.resolve(false)
    }
  }

  /**
   * 清除缓存
   */
  @ReactMethod
  fun cleanAppCache(promise: Promise) {
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
  fun reloadBundle(promise: Promise) {
    currentActivity?.let {
      ReloadBundleAction(it as? RNContainerActivity).doAction()
      promise.resolve(true)
    } ?: {
      ToastUtils.showShort("currentActivity is null")
      promise.resolve(false)
    }
  }

  @ReactMethod
  fun memoryTest(promise: Promise) {
    //Android 不实现
  }

  @ReactMethod
  fun memoryAdd(promise: Promise) {
    //Android 不实现
  }

  @ReactMethod
  fun toggleInspector(promise: Promise) {
    val host = (currentActivity as? RNContainerActivity)?.getRNHost()
    val devSupportManager: XDevSupportManager? = host?.reactInstanceManager?.devSupportManager as? XDevSupportManager
    val reactInstanceDevHelper: ReactInstanceDevHelper? = devSupportManager?.reactInstanceDevHelper
    reactInstanceDevHelper?.toggleElementInspector()
  }

  @ReactMethod
  fun getInspectorIsShown(promise: Promise) {
    val host = (currentActivity as? RNContainerActivity)?.getRNHost()
    val devSettings = host?.reactInstanceManager?.devSupportManager?.devSettings
    return promise.resolve(devSettings?.isElementInspectorEnabled ?: false)
  }

  @ReactMethod
  fun togglePerfMonitor(promise: Promise) {
    val host = (currentActivity as? RNContainerActivity)?.getRNHost()
    val devSettings = host?.reactInstanceManager?.devSupportManager?.devSettings as? XDevInternalSettings
    if (devSettings != null) {
      devSettings.isFpsDebugEnabled = !devSettings.isFpsDebugEnabled
    }
  }

  @ReactMethod
  fun getPerfMonitorIsShown(promise: Promise) {
    val host = (currentActivity as? RNContainerActivity)?.getRNHost()
    val devSettings = host?.reactInstanceManager?.devSupportManager?.devSettings as? XDevInternalSettings
    promise.resolve(devSettings?.isFpsDebugEnabled ?: false)
  }

  /**
   * 获取所有 bundle 信息
   */
  @ReactMethod
  fun getAllBundlesDataSync(promise: Promise) {
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
  fun routeInfo(promise: Promise?) {
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

  @ReactMethod
  fun nativeCrash() {
    MockCrashAction().doAction()
  }

  @ReactMethod(isBlockingSynchronousMethod = true)
  fun getBundleHostIPSync(): String {
    val sp = PreferenceManager.getDefaultSharedPreferences(currentActivity)
    val ip = sp.getString(XPackageConnectionSettings.PREFS_DEBUG_SERVER_IP_KEY, "") ?: ""
    return ip;
  }

  @ReactMethod
  fun setBundleHostIP(host: String?) {
    val sp = PreferenceManager.getDefaultSharedPreferences(currentActivity)
    sp.edit().putString(XPackageConnectionSettings.PREFS_DEBUG_SERVER_IP_KEY, host).apply()
  }

  companion object {
    const val NAME = "XRNDebugToolsModule"
  }
}
