package xrn.modules.network

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

class XRNNetworkModulePackage : BaseReactPackage() {
  override fun getModule(
    name: String,
    reactContext: ReactApplicationContext
  ): NativeModule? {
    return if (name == XRNNetworkModule.NAME) {
      XRNNetworkModule(reactContext)
    } else {
      null
    }
  }

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
    return ReactModuleInfoProvider {
      mapOf(
        XRNNetworkModule.NAME to ReactModuleInfo(
          XRNNetworkModule.NAME,
          XRNNetworkModule.NAME,
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
