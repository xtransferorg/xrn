package com.xrn.template.multibundle

import android.app.Application
import xrn.modules.multibundle.runtime.XRNJSBundleLoader
import xrn.modules.multibundle.runtime.JSBundleFileHolder


open class CodePushJSBundleLoader(
    override val application: Application,
    override var bundleName: String,
    override var loadCommonOnly: Boolean,
    override val jsBundleFileHolder: JSBundleFileHolder
) : XRNJSBundleLoader(
    application,
    bundleName,
    loadCommonOnly,
    jsBundleFileHolder,
)
