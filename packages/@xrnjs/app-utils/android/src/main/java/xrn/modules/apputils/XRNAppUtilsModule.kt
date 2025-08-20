package xrn.modules.apputils

import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.text.TextUtils
import com.blankj.utilcode.util.AppUtils
import com.blankj.utilcode.util.LogUtils
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise

class XRNAppUtilsModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  companion object {
    const val PKG_NAME = "XRNAppUtilsModule"
  }

  private val rootChecker by lazy {
    RootChecker(reactApplicationContext)
  }

  @ReactMethod
  fun isAppRooted(promise: Promise) {
    promise.resolve(rootChecker.isDeviceRooted)
  }

  /**
   * 安装指定 Apk 文件
   * @param file Apk 文件目录
   */
  @ReactMethod
  fun installApp(file: String) = AppUtils.installApp(file)

  /**
   * 判断指定包名的App是否已安装
   * 同步方法
   * @param packageName 包名
   */
  @ReactMethod(isBlockingSynchronousMethod = true)
  fun isAppInstalled(packageName: String): Boolean {
    return AppUtils.isAppInstalled(packageName)
  }

  @ReactMethod
  fun exitApp() = AppUtils.exitApp()

  @ReactMethod
  fun relaunchApp() = AppUtils.relaunchApp()

  @ReactMethod
  fun moveTaskToBack() {
    currentActivity?.moveTaskToBack(true)
  }

  @ReactMethod
  fun launchAppDetail(appPkgName: String?, marketPgkName: String?, promise: Promise?) {
    try {
      if (TextUtils.isEmpty(appPkgName)) {
        promise?.resolve(false)
        return
      }
      val uri: Uri = Uri.parse("market://details?id=$appPkgName")
      val intent = Intent(Intent.ACTION_VIEW, uri)
      if (!TextUtils.isEmpty(marketPgkName)) {
        intent.setPackage(marketPgkName)
      }
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      reactApplicationContext.startActivity(intent)
      promise?.resolve(true)
    } catch (e: java.lang.Exception) {
      promise?.reject(e)
      e.printStackTrace()
    }
  }

  @ReactMethod
  fun isGooglePlayStoreInstalled(promise: Promise?) {
    try {
      val packageManager: PackageManager = reactApplicationContext.packageManager
      // 尝试获取 Google Play Store 应用的信息
      val packageInfo =
        packageManager.getPackageInfo("com.android.vending", PackageManager.GET_ACTIVITIES)
      LogUtils.d("packageInfo", packageInfo)
      // 如果没有抛出异常，表示已安装 Google Play Store
      promise?.resolve(true)
    } catch (e: PackageManager.NameNotFoundException) {
      // 如果抛出异常，表示未安装 Google Play Store
      promise?.resolve(false)
    }
  }

  override fun getName(): String {
    return PKG_NAME
  }

}
