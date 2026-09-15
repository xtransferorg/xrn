package xrn.modules.navigation

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider


class XRNNavigationPackage : BaseReactPackage() {
    override fun getModule(
        name: String,
        reactContext: ReactApplicationContext
    ): NativeModule? {
        if (name == XRNNavigationModule.NAME) {
            return XRNNavigationModule(reactContext)
        } else if (name == BundleNavigationModule.NAME) {
            return BundleNavigationModule(reactContext)
        }
        return null
    }

    override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
        return ReactModuleInfoProvider {
            mapOf(
                XRNNavigationModule.NAME to ReactModuleInfo(
                    XRNNavigationModule.NAME,
                    XRNNavigationModule.NAME,
                    canOverrideExistingModule = false,
                    needsEagerInit = false,
                    hasConstants = false,
                    isCxxModule = false,
                    isTurboModule = true
                ),
                BundleNavigationModule.NAME to ReactModuleInfo(
                    BundleNavigationModule.NAME,
                    BundleNavigationModule.NAME,
                    canOverrideExistingModule = false,
                    needsEagerInit = false,
                    hasConstants = false,
                    isCxxModule = false,
                    isTurboModule = true
                )
            )
        }
    }

}