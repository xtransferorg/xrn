package com.xrngo.multibundle

import xrn.modules.multibundle.bundle.BundleInfo
import xrn.modules.multibundle.bundle.BundleInfoHook

class XGoBundleInfoHook: BundleInfoHook {

    override val hookCodePushKey: ((info: BundleInfo) -> String)? = null
}