package xrn.modules.multibundle.runtime

import android.app.Application
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage

fun XRNReactHostDelegate.toReactNativeHost(application: Application): ReactNativeHost {
    return object : ReactNativeHost(application) {

        override fun getJSMainModuleName(): String {
            return this@toReactNativeHost.jsMainModulePath
        }

        override fun getUseDeveloperSupport(): Boolean {
            return this@toReactNativeHost.getUseDeveloperSupport()
        }

        override fun getPackages(): List<ReactPackage?> {
            return this@toReactNativeHost.reactPackages
        }
    }
}

