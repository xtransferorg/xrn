package xrn.modules.apputils

import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import com.blankj.utilcode.util.AppUtils
import com.blankj.utilcode.util.LogUtils
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.Promise
import com.facebook.react.module.annotations.ReactModule

@ReactModule(XRNAppUtilsModule.PKG_NAME)
class XRNAppUtilsModule(reactContext: ReactApplicationContext) :
    NativeXRNAppUtilsModuleSpec(reactContext) {

    companion object {
        const val PKG_NAME = "XRNAppUtilsModule"

        private val MARKET_DETAIL_URI_PREFIX_MAP = mapOf(
            "com.huawei.appmarket" to "appmarket://details?id=",
            "com.heytap.market" to "oppomarket://details?packagename=",
            "com.oppo.market" to "oppomarket://details?packagename=",
            "com.bbk.appstore" to "vivomarket://details?id=",
            "com.hihonor.appmarket" to "honormarket://details?id=",
            "com.tencent.android.qqdownloader" to "tmast://appdetails?pname="
        )
    }

    private val rootChecker by lazy {
        RootChecker(reactApplicationContext)
    }

    override fun isAppRooted(promise: Promise) {
        promise.resolve(rootChecker.isDeviceRooted)
    }

    override fun checkSysIntegrity(
        nonce: String?,
        promise: Promise?
    ) {
        promise?.resolve(false)
    }

    /**
     * 安装指定 Apk 文件
     * @param file Apk 文件目录
     */

    override fun installApp(file: String): Boolean {
        AppUtils.installApp(file)
        return true
    }

    /**
     * 判断指定包名的App是否已安装
     * 同步方法
     * @param packageName 包名
     */
    override fun isAppInstalled(packageName: String): Boolean {
        return AppUtils.isAppInstalled(packageName)
    }

    override fun exitApp(): Boolean {
        AppUtils.exitApp()
        return true
    }

    override fun relaunchApp(): Boolean {
        AppUtils.relaunchApp()
        return true
    }

    override fun moveTaskToBack(): Boolean {
        val intent = Intent("android.intent.action.MAIN")
        intent.addCategory("android.intent.category.HOME")
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        currentActivity?.startActivity(intent)
        return true
    }

    override fun launchAppDetail(appPkgName: String?, marketPgkName: String?, promise: Promise?) {
        try {
            if (marketPgkName.isNullOrEmpty() || !AppUtils.isAppInstalled(marketPgkName)) {
                promise?.reject("market_not_installed", "Target app market is not installed")
                return
            }
            if (appPkgName.isNullOrEmpty()) {
                promise?.reject("app_detail_invalid_params", "appPkgName is empty")
                return
            }
            val intent = createAppDetailIntents(appPkgName, marketPgkName).firstOrNull {
                it.resolveActivity(reactApplicationContext.packageManager) != null
            }
            if (intent == null) {
                promise?.reject(
                    "app_detail_unavailable",
                    "No activity can handle app detail for appPkgName=$appPkgName, marketPgkName=$marketPgkName"
                )
                return
            }
            reactApplicationContext.startActivity(intent)
            promise?.resolve(null)
        } catch (e: java.lang.Exception) {
            promise?.reject("store_open_failed", "Failed to open app detail", e)
            e.printStackTrace()
        }
    }

    private fun createAppDetailIntents(appPkgName: String, marketPgkName: String): List<Intent> {
        val vendorUri = MARKET_DETAIL_URI_PREFIX_MAP[marketPgkName]?.plus(appPkgName)
        return listOfNotNull(
            vendorUri,
            "market://details?id=$appPkgName"
        ).map { uri ->
            Intent(Intent.ACTION_VIEW, Uri.parse(uri)).apply {
                setPackage(marketPgkName)
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
        }
    }


    override fun isGooglePlayStoreInstalled(promise: Promise?) {
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
