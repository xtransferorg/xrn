package xrn.modules.assetloader

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider


class XRNAssetLoaderPackage : BaseReactPackage() {
    override fun getModule(
        name: String,
        reactContext: ReactApplicationContext
    ): NativeModule? {
        return if (name == XRNAssetLoaderModule.NAME) {
            XRNAssetLoaderModule(reactContext)
        } else {
            null
        }
    }

    override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
        return ReactModuleInfoProvider {
            mapOf(
                XRNAssetLoaderModule.NAME to ReactModuleInfo(
                    XRNAssetLoaderModule.NAME,
                    XRNAssetLoaderModule.NAME,
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
