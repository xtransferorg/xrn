package xrn.modules.keyboard

import com.facebook.react.BaseReactPackage
import com.facebook.react.ViewManagerOnDemandReactPackage
import com.facebook.react.bridge.ModuleSpec
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfoProvider
import com.facebook.react.uimanager.ViewManager
import com.facebook.react.views.modal.ReactModalHostManager
import com.xrn.keyboard.NativeXRNKeyboardModuleSpec


class XRNKeyboardPackage : BaseReactPackage(), ViewManagerOnDemandReactPackage {

  public val viewManagersMap: Map<String, ModuleSpec> =
    mapOf(
      ReactModalHostManager.REACT_CLASS to  ModuleSpec.viewManagerSpec { XTModalHostViewManager() },
    )

  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
    return listOf(XRNKeyboardModule(reactContext))
  }

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
    return listOf(XTModalHostViewManager())
  }

  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? {
    if (name == NativeXRNKeyboardModuleSpec.NAME) {
      return XRNKeyboardModule(reactContext)
    }
    return null
  }

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
    return object : ReactModuleInfoProvider {
      override fun getReactModuleInfos(): Map<String, com.facebook.react.module.model.ReactModuleInfo> {
        return mapOf(
          NativeXRNKeyboardModuleSpec.NAME to com.facebook.react.module.model.ReactModuleInfo(
            NativeXRNKeyboardModuleSpec.NAME,
            NativeXRNKeyboardModuleSpec.NAME,
            false,
            false,
            false,
            false,
            true
          )
        )
      }
    }
  }

  override fun createViewManager(
    reactContext: ReactApplicationContext,
    viewManagerName: String
  ): ViewManager<in Nothing, in Nothing>? {
    val spec = viewManagersMap[viewManagerName]
    return spec?.provider?.get() as? ViewManager<*, *>
  }

  override fun getViewManagerNames(reactContext: ReactApplicationContext): Collection<String> {
    return viewManagersMap.keys
  }
}
