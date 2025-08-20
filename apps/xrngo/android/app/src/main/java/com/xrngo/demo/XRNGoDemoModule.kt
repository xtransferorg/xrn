package com.xrngo.demo

import android.content.Intent
import com.blankj.utilcode.util.ActivityUtils
import com.facebook.react.bridge.BaseJavaModule
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class XRNGoDemoModule: ReactContextBaseJavaModule() {

    companion object {
        const val NAME = "XRNGODemoModule"
    }

    override fun getName(): String {
        return NAME
    }

    @ReactMethod
    fun jumpMultiBundleDemo() {
        val activity = ActivityUtils.getTopActivity()
        val intent = Intent(activity, MultiBundleActivity::class.java)
        activity.startActivity(intent)
    }
}