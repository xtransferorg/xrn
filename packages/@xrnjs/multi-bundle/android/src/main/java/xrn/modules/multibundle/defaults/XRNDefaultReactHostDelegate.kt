package xrn.modules.multibundle.defaults

import com.facebook.react.ReactPackageTurboModuleManagerDelegate
import com.facebook.react.common.build.ReactBuildConfig
import com.facebook.react.defaults.DefaultTurboModuleManagerDelegate
import com.facebook.react.devsupport.DevSupportManagerFactory
import com.facebook.react.fabric.ReactNativeConfig
import com.facebook.react.runtime.BindingsInstaller
import com.facebook.react.runtime.JSRuntimeFactory
import com.facebook.react.runtime.hermes.HermesInstance
import xrn.modules.multibundle.devsupport.XRNDevSupportManagerFactory
import xrn.modules.multibundle.devsupport.XRNDeveloperSettings
import xrn.modules.multibundle.runtime.JSBundleType
import xrn.modules.multibundle.runtime.XRNReactHostDelegate


abstract class XRNDefaultReactHostDelegate(override var bundleName: String) : XRNReactHostDelegate {

    override val bindingsInstaller: BindingsInstaller?
        get() = null
    override val jsMainModulePath: String
        get() = "index"
    override val jsRuntimeFactory: JSRuntimeFactory
        get() = HermesInstance()
    override val turboModuleManagerDelegateBuilder: ReactPackageTurboModuleManagerDelegate.Builder
        get() = DefaultTurboModuleManagerDelegate.Builder()

    override fun getJSBundleFile(jsBundleType: JSBundleType): String {
        return "assets://index.android.bundle"
    }

    override fun isSplitMode(): Boolean {
        return if (this.getUseDeveloperSupport()) {
            XRNDeveloperSettings.instance(bundleName)?.isSplitBundleDebugEnabled(true) != false
        } else {
            true
        }
    }

    override fun getUseDeveloperSupport(): Boolean {
        return if (ReactBuildConfig.DEBUG) {
            XRNDeveloperSettings.instance(bundleName)?.isBundleDebugEnabled() == true
        } else {
            false
        }
    }

    override fun getDevSupportManagerFactory(): DevSupportManagerFactory {
        return XRNDevSupportManagerFactory(bundleName)
    }

    override fun getReactNativeConfig(): ReactNativeConfig {
        return ReactNativeConfig.DEFAULT_CONFIG
    }

    override fun handleInstanceException(error: Exception) {
        throw error
    }

}