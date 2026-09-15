package xrn.modules.nativestorage

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider


class XRNNativeStoragePackage : BaseReactPackage() {
    override fun getModule(
        name: String,
        reactContext: ReactApplicationContext
    ): NativeModule? {
        if (name == XRNNativeStorageModule.NAME) {
            return XRNNativeStorageModule(reactContext)
        }
        return null
    }

    override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
        return ReactModuleInfoProvider {
            mapOf(
                XRNNativeStorageModule.NAME to ReactModuleInfo(
                    XRNNativeStorageModule.NAME,
                    XRNNativeStorageModule.NAME,
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
