package xrn.modules.apputils

import com.facebook.react.BaseReactPackage
import com.facebook.react.ReactPackage
import com.facebook.react.TurboReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider
import com.facebook.react.uimanager.ViewManager


class XRNAppUtilsPackage : BaseReactPackage() {

    override fun getModule(
        name: String,
        reactContext: ReactApplicationContext
    ): NativeModule? {
        return if (name == XRNAppUtilsModule.PKG_NAME) {
            XRNAppUtilsModule(reactContext)
        } else {
            null
        }
    }

    override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
        return object : ReactModuleInfoProvider {
            override fun getReactModuleInfos(): Map<String, ReactModuleInfo> {
                return mapOf(
                    XRNAppUtilsModule.PKG_NAME to ReactModuleInfo(
                        XRNAppUtilsModule.PKG_NAME,
                        XRNAppUtilsModule::class.java.name,
                        canOverrideExistingModule = false,
                        needsEagerInit = false,
                        isCxxModule = false,
                        isTurboModule = true
                    )
                )
            }
        }
    }

}
