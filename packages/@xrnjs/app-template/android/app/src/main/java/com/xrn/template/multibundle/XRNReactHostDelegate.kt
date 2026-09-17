package com.xrn.template.multibundle

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.JSBundleLoader
import xrn.modules.keyboard.XRNKeyboardPackage
import xrn.modules.multibundle.bundle.BundleInfoManager
import xrn.modules.multibundle.defaults.XRNDefaultReactHostDelegate
import xrn.modules.multibundle.runtime.JSBundleType

class XRNReactHostDelegate(
    val application: Application,
    override var bundleName: String,
    val commonOnly: Boolean
) : XRNDefaultReactHostDelegate(bundleName) {

    private val mCodePush by lazy { CodePushUtils.getOrCreate(bundleName, null, true).codePush }

    private val mJSBundleLoader = object : CodePushJSBundleLoader(
        application, bundleName, commonOnly, this@XRNReactHostDelegate
    ) {
        override fun onLoadStart(bundleType: JSBundleType, bundleName: String) {
            super.onLoadStart(bundleType, bundleName)
            if (bundleType == JSBundleType.BIZ) {
                val deploymentKey =
                    BundleInfoManager.getBundleInfo(bundleName)?.getCodePushKey() ?: return
                this@XRNReactHostDelegate.mCodePush.resetDeploymentKey(deploymentKey)
                CodePushUtils.getOrCreate(bundleName, mCodePush)
            }
        }
    }
    override val jsBundleLoader: JSBundleLoader = mJSBundleLoader

    override val reactPackages: List<ReactPackage>
        get() {
            return PackageList(application).packages.apply {
                //懒加载时，遍历需要放在前面
                add(0, XRNKeyboardPackage())
                add(0, mCodePush)
            }
        }

    override fun isSplitMode(): Boolean {
        return false
    }

    override fun getJSBundleFile(jsBundleType: JSBundleType): String {
        return when (jsBundleType) {
            JSBundleType.COMMON -> ""
            JSBundleType.BIZ -> mCodePush.getJSBundleFile(
                XBundleTool.getBizAssetsBundleFileName(bundleName)
            )
        }
    }
}
