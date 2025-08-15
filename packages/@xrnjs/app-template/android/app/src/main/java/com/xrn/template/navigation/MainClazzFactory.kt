package com.xrn.template.navigation

import xrn.modules.multibundle.bundle.BundleType
import xrn.modules.navigation.kotlin.BaseRNContainerActivity
import xrn.modules.navigation.kotlin.RNContainerActivityClazzFactory

class MainClazzFactory : RNContainerActivityClazzFactory {
    override fun get(type: BundleType): Class<out BaseRNContainerActivity> {
        return when (type) {
            BundleType.MAIN -> XMainActivity::class.java
            else -> XBundleActivity::class.java
        }
    }
}
