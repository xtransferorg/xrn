package com.xrn.template

import android.content.Context
import com.blankj.utilcode.util.ReflectUtils
import com.facebook.react.ReactHost
import com.facebook.react.config.ReactFeatureFlags
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.soloader.OpenSourceMergedSoMapping
import com.facebook.soloader.SoLoader
import com.xrn.template.multibundle.XRNReactHostDelegate
import com.xrn.template.navigation.MainClazzFactory
import xrn.modules.multibundle.ReactHostManager
import xrn.modules.multibundle.XRNApplication
import xrn.modules.multibundle.bundle.BundleInfoManager
import xrn.modules.multibundle.runtime.XRNReactHostFactory
import xrn.modules.multibundle.runtime.XRNReactHostImpl
import xrn.modules.multibundle.runtime.pool.XRNReactHostPool
import xrn.modules.multibundle.runtime.pool.XRNReactHostPoolImpl
import xrn.modules.multibundle.runtime.toReactHost
import xrn.modules.navigation.Navigation
import java.lang.reflect.InvocationTargetException


class MainApplication : XRNApplication() {

    private val mReactHostPool = XRNReactHostPoolImpl(!BuildConfig.DEBUG, 4, object : XRNReactHostFactory {
        override fun createReactHost(
            bundleName: String,
            commonOnly: Boolean
        ): XRNReactHostImpl {
            return XRNReactHostDelegate(
                this@MainApplication,
                bundleName,
                commonOnly
            ).toReactHost(this@MainApplication)
        }
    })

    override val reactHostPool: XRNReactHostPool = mReactHostPool

    override fun onCreate() {
        super.onCreate()
        initRN()
        initMultiBundle()
        initializeFlipper(this, reactHost)
        Navigation.initialize(MainClazzFactory())
    }

    private fun initRN() {
        ReactFeatureFlags.dispatchPointerEvents = true
        SoLoader.init(this, OpenSourceMergedSoMapping)
        if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
            // If you opted-in for the New Architecture, we load the native entry point for this app.
            load(turboModulesEnabled = true, fabricEnabled = true, bridgelessEnabled = true)
        }
    }

    private fun initMultiBundle() {
        BundleInfoManager.initWithRawFile(this, R.raw.bundle_config)
        ReactHostManager.init(this)
    }

    private fun initializeFlipper(context: Context, reactHost: ReactHost) {
        if (BuildConfig.DEBUG) {
            try {
                ReflectUtils.reflect("com.xrn.template.ReactNativeFlipper")
                    .method("initializeFlipper", context, reactHost)
            } catch (e: ClassNotFoundException) {
                e.printStackTrace();
            } catch (e: NoSuchMethodException) {
                e.printStackTrace();
            } catch (e: IllegalAccessException) {
                e.printStackTrace();
            } catch (e: InvocationTargetException) {
                e.printStackTrace();
            }
        }
    }

}
