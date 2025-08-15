package com.xrngo.demo

import android.view.View
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ReactShadowNode
import com.facebook.react.uimanager.ViewManager

class XRNGoDemoPackage: ReactPackage {
    override fun createNativeModules(p0: ReactApplicationContext): List<NativeModule> {
        return listOf(XRNGoDemoModule())
    }

    override fun createViewManagers(p0: ReactApplicationContext): List<ViewManager<View, ReactShadowNode<*>>> {
        return emptyList()
    }
}