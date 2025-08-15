package xrn.modules.bundle

import android.content.Context
import com.facebook.react.bridge.WritableNativeArray
import com.facebook.react.bridge.WritableNativeMap
import com.google.gson.Gson
import com.microsoft.codepush.react.CodePushConstants
import com.microsoft.codepush.react.CodePushUpdateManager
import com.microsoft.codepush.react.SettingsManager
import org.json.JSONObject
import xrn.modules.multibundle.bundle.BundleInfo
import xrn.modules.multibundle.bundle.BundleInfoManager

data class CodePushBundleInfoList(val bundleInfoList: List<CodePushBundleInfo>)
data class CodePushBundleInfo(val bundleName: String, val codePushPackage: CodePushPackage?)

data class CodePushPackage(
    val appVersion: String?,
    val binaryModifiedTime: String?,
    val bundlePath: String?,
    val deploymentKey: String?,
    val description: String?,
    val downloadUrl: String?,
    val failedInstall: Boolean,
    val isMandatory: Boolean,
    val isPending: Boolean,
    val label: String?,
    val packageHash: String?,
    val packageSize: Int
)

private fun getCodePushPackageJSON(context: Context?,
    info: BundleInfo
): JSONObject? {
    if (context == null) {
        return null
    }
    val deploymentKey = info.getCodePushKey()
    val settingsManager = SettingsManager(context, deploymentKey)
    val updateManager = CodePushUpdateManager(
        context, context.filesDir.absolutePath, deploymentKey
    )
    val currentPackage: JSONObject = updateManager.currentPackage ?: return null
    var currentUpdateIsPending = false
    if (currentPackage.has(CodePushConstants.PACKAGE_HASH_KEY)) {
        val currentHash = currentPackage.optString(CodePushConstants.PACKAGE_HASH_KEY, null)
        currentUpdateIsPending = settingsManager.isPendingUpdate(currentHash)
    }
    if (currentUpdateIsPending) {
        return updateManager.previousPackage ?: return null
    } else {
        return currentPackage
    }
}

fun getBundleInfo(context: Context?, info: BundleInfo): CodePushBundleInfo {
    return CodePushBundleInfo(
        info.bundleName,
        Gson().fromJson(getCodePushPackageJSON(context, info).toString(), CodePushPackage::class.java)
    )
}

fun getCodePushBundleInfoList(context: Context?): CodePushBundleInfoList {
    val codePushInfoList = BundleInfoManager.getAllBundleInfo().map { info ->
        getBundleInfo(context, info)
    }
    val codePushBundleInfoList = CodePushBundleInfoList(codePushInfoList)
    return codePushBundleInfoList
}

fun convertCodePushPackage2Map(info: CodePushPackage?): WritableNativeMap {
    val map = WritableNativeMap()
    info?.let {
        map.putString("appVersion", info.appVersion)
        map.putString("binaryModifiedTime", info.binaryModifiedTime)
        map.putString("bundlePath", info.bundlePath)
        map.putString("deploymentKey", info.deploymentKey)
        map.putString("description", info.description)
        map.putString("downloadUrl", info.downloadUrl)
        map.putBoolean("failedInstall", info.failedInstall)
        map.putBoolean("isMandatory", info.isMandatory)
        map.putBoolean("isPending", info.isPending)
        map.putString("label", info.label)
        map.putString("packageHash", info.packageHash)
        map.putInt("packageSize", info.packageSize)
    }
    return map
}

fun convertCodePushInfo2Map(info: CodePushBundleInfo): WritableNativeMap {
    val map = WritableNativeMap()
    map.putString("bundleName", info.bundleName)
    map.putMap("codePushPackage", convertCodePushPackage2Map(info.codePushPackage))
    return map
}

fun convertCodePushBundleInfoList2Map(codePushBundleInfoList: CodePushBundleInfoList):  WritableNativeMap {
    val bundleInfoList = codePushBundleInfoList.bundleInfoList.map {
        convertCodePushInfo2Map(it)
    }
    val writableNativeArray = WritableNativeArray()
    for (info in bundleInfoList) {
        writableNativeArray.pushMap(info)
    }
    val map = WritableNativeMap()
    map.putArray("bundleInfoList", writableNativeArray)
    return map
}

