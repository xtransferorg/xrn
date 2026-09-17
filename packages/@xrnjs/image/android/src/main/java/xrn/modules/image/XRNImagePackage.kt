package xrn.modules.image

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider
import com.facebook.react.uimanager.ViewManager

class XRNImagePackage : BaseReactPackage() {

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<in Nothing, in Nothing>> {
        return listOf(XRNImageViewManager())
    }

    override fun getModule(
        name: String,
        reactContext: ReactApplicationContext
    ): NativeModule? {
        if (name == XRNImageModule.NAME) {
            return XRNImageModule(reactContext)
        }

        return null
    }

    override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
        return object : ReactModuleInfoProvider {
            override fun getReactModuleInfos(): Map<String, ReactModuleInfo> {
                return mapOf(XRNImageModule.NAME to ReactModuleInfo(
                    XRNImageModule.NAME,
                    XRNImageModule.NAME,
                    false,
                    false,
                    true,
                    false,
                    true
                ))
            }
        }
    }
}