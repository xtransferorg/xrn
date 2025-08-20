package xrn.modules.navigation.kotlin

import xrn.modules.multibundle.bundle.BundleType

interface RNContainerActivityClazzFactory {
    fun get(type: BundleType): Class<out BaseRNContainerActivity>
}