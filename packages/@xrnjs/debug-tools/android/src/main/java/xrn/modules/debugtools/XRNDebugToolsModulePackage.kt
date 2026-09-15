package xrn.modules.debugtools

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider
import com.facebook.react.uimanager.ViewManager


class XRNDebugToolsModulePackage : BaseReactPackage() {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        return listOf(XRNDebugToolsModule(reactContext))
    }

    override fun getModule(
        name: String,
        reactContext: ReactApplicationContext
    ): NativeModule? {
        return if (name == XRNDebugToolsModule.NAME) {
            XRNDebugToolsModule(reactContext)
        } else {
            return null
        }
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        return emptyList()
    }

    override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
        return ReactModuleInfoProvider {
            mapOf(
                XRNDebugToolsModule.NAME to ReactModuleInfo(
                    XRNDebugToolsModule.NAME,
                    XRNDebugToolsModule.NAME,
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
