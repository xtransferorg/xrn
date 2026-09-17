package xrn.modules.network

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.annotations.ReactModule

@ReactModule(name = XRNNetworkModule.NAME)
class XRNNetworkModule(reactContext: ReactApplicationContext) :
  NativeXRNNetworkModuleSpec(reactContext) {

  override fun getName(): String {
    return NAME
  }

  companion object {
    const val NAME = "XRNNetworkModule"
  }
}
