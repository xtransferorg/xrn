package xrn.modules.bundle

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider


class XRNBundleModulePackage : BaseReactPackage() {
    override fun getModule(
        name: String,
        reactContext: ReactApplicationContext
    ): NativeModule? {
        return if (name == XRNBundleModule.NAME) {
            XRNBundleModule(reactContext)
        } else {
            null
        }
    }

    override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
        return ReactModuleInfoProvider {
            mapOf(
                XRNBundleModule.NAME to ReactModuleInfo(
                    XRNBundleModule.NAME,
                    XRNBundleModule.NAME,
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
