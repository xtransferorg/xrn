package com.xrn.template.multibundle

object XBundleTool {

    fun getBizAssetsBundleFileName(bundleName: String): String {
        return "index.${bundleName}.bundle"
    }

}
