package com.xrn.template.multibundle

import xrn.modules.multibundle.bundle.BundleInfo
import xrn.modules.multibundle.bundle.BundleInfoHook

class XBundleInfoHook: BundleInfoHook {

    override val hookCodePushKey: ((info: BundleInfo) -> String)? = null
}