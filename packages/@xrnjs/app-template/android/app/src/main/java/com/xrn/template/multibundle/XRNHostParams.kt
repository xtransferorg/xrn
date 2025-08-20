package com.xrn.template.multibundle

import android.app.Application
import com.blankj.utilcode.util.LogUtils
import com.facebook.hermes.reactexecutor.HermesExecutorFactory
import com.facebook.react.PackageList
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.JavaScriptExecutorFactory
import com.microsoft.codepush.react.CodePush
import com.xrn.template.BuildConfig
import com.xrn.template.R
import xrn.modules.multibundle.bundle.BundleInfo
import xrn.modules.multibundle.bundle.RNHostManager
import xrn.modules.multibundle.bundle.RNHostParams
import xrn.modules.multibundle.devsupport.XDevInternalSettings
import xrn.modules.multibundle.devsupport.XDevSupportManagerFactory

class XRNHostParams(val application: Application): RNHostParams() {

    companion object {
        const val COMMON_BUNDLE_NAME = "xt-app-common"
        val codePushMap = mutableMapOf<String, CodePush>()
    }

    override val isSplitMode: ((bundleName: String) -> Boolean)? = { bundleName ->
        false
    }

    override val getJSMainModuleName: ((info: BundleInfo, isSplitMode: Boolean) -> String)? = { info, isSplitMode ->
        "index"
    }

    override val getJSBundleFile: ((info: BundleInfo, isSplitMode: Boolean) -> String?)? = {info, isSplitMode ->
        if (isSplitMode) {
            "assets://index.${COMMON_BUNDLE_NAME}.bundle"
        } else {
            codePushMap[info.bundleName]?.getJSBundleFile("index.${info.bundleName}.bundle")
        }
    }

    override val getBizJSBundleFile: ((info: BundleInfo, isSplitMode: Boolean) -> String?)? = {info, isSplitMode ->
        codePushMap[info.bundleName]?.getJSBundleFile("index.${info.bundleName}.bundle")
    }

    override val getPackage: ((info: BundleInfo) -> List<ReactPackage>?)? = { info ->
        val codePush = CodePush(
            info.getCodePushKey(),
            application,
            BuildConfig.DEBUG,
            BuildConfig.CODEPUSH_URL,
            R.string.codepush_public_key
        )
        codePush.setReactInstanceHolder {
            RNHostManager.getRNHostByBundle(info.bundleName)?.reactInstanceManager
        }
        codePushMap[info.bundleName] = codePush
        val packages: MutableList<ReactPackage> = PackageList(application).packages
        packages.add(codePush)
        packages
    }

    override val getUseDeveloperSupport: ((info: BundleInfo) -> Boolean)? = { info: BundleInfo ->
        if (BuildConfig.DEBUG) XDevInternalSettings.instance(info.bundleName)?.isBundleDebugEnabled() == true else false
    }

    override var getDevSupportManagerFactory: ((info: BundleInfo) -> XDevSupportManagerFactory?)? = { info: BundleInfo ->
        if (getUseDeveloperSupport?.invoke(info) == true) {
            XDevSupportManagerFactory(info.bundleName)
        } else {
            null
        }
    }

    /**
     * 用于创建 JavaScriptExecutor
     */
    override var getJavaScriptExecutorFactory: ((info: BundleInfo) -> JavaScriptExecutorFactory?)? = { info: BundleInfo ->
        LogUtils.d("enableHermes", BuildConfig.IS_HERMES_ENABLED)

        if(BuildConfig.IS_HERMES_ENABLED) HermesExecutorFactory() else null
    }
}