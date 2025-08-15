package com.xrn.template

import android.content.Context
import androidx.multidex.MultiDexApplication
import com.blankj.utilcode.util.ActivityUtils
import com.facebook.react.ReactApplication
import com.facebook.react.ReactInstanceManager
import com.facebook.react.ReactNativeHost
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.soloader.SoLoader
import com.xrn.template.multibundle.XBundleInfoHook
import com.xrn.template.multibundle.XDevSupportParams
import com.xrn.template.multibundle.XRNHostParams
import com.xrn.template.navigation.MainClazzFactory
import xrn.modules.multibundle.bundle.BundleInfoManager.initWithRawFile
import xrn.modules.multibundle.bundle.RNHostManager.getMainRNHost
import xrn.modules.multibundle.bundle.RNHostManager.init
import xrn.modules.multibundle.bundle.RNHostManagerParams
import xrn.modules.multibundle.view.RNContainerActivity
import xrn.modules.navigation.Navigation.initialize
import xrn.modules.navigation.kotlin.exception.NavigationException
import java.lang.reflect.InvocationTargetException


class MainApplication : MultiDexApplication(), ReactApplication {
    override fun getReactNativeHost(): ReactNativeHost {
        val topActivity = ActivityUtils.getTopActivity()
        if (topActivity is RNContainerActivity) {
            return topActivity.getRNHost()!!
        }
        return getMainRNHost()!!
    }

    override fun onCreate() {
        super.onCreate()
        initMultiBundle()
        initNavigation()
        SoLoader.init(this,  /* native exopackage */false)
        if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
            // If you opted-in for the New Architecture, we load the native entry point for this app.
            load()
        }
        initializeFlipper(this, reactNativeHost.reactInstanceManager)
    }

    private fun initMultiBundle() {
        initWithRawFile(this, R.raw.bundle_config, XBundleInfoHook())
        val params = RNHostManagerParams()
        params.isProd = !BuildConfig.DEBUG
        params.rnHostParams = XRNHostParams(this)
        params.devSupportParams = XDevSupportParams()
        params.onError = { e: Exception, map: Map<String, Any?>? ->
            e.printStackTrace()
            Unit
        }
        init(this, params)
    }

    private fun initNavigation() {
        initialize(MainClazzFactory()) { e: NavigationException ->
            e.printStackTrace()
        }
    }

    companion object {
        private fun initializeFlipper(
            context: Context, reactInstanceManager: ReactInstanceManager
        ) {
            if (BuildConfig.DEBUG) {
                try {
                    val aClass = Class.forName("com.xrn.template.ReactNativeFlipper")
                    aClass
                        .getMethod(
                            "initializeFlipper",
                            Context::class.java,
                            ReactInstanceManager::class.java
                        )
                        .invoke(null, context, reactInstanceManager)
                } catch (e: ClassNotFoundException) {
                    e.printStackTrace()
                } catch (e: NoSuchMethodException) {
                    e.printStackTrace()
                } catch (e: IllegalAccessException) {
                    e.printStackTrace()
                } catch (e: InvocationTargetException) {
                    e.printStackTrace()
                }
            }
        }
    }
}
