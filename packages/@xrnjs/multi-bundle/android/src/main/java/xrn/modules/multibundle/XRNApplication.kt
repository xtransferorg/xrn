package xrn.modules.multibundle

import android.app.Application
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultReactNativeHost
import xrn.modules.multibundle.runtime.XRNReactApplication


abstract class XRNApplication : Application(), XRNReactApplication {

    override val reactHost: ReactHost
        get() = ReactHostManager.current()

    // TODO 是否需要实现？
    override val reactNativeHost: ReactNativeHost =

        object : DefaultReactNativeHost(this) {
            override fun getUseDeveloperSupport(): Boolean {
                return false
            }

            override fun getPackages(): List<ReactPackage?> {
                return emptyList()
            }
        }

}