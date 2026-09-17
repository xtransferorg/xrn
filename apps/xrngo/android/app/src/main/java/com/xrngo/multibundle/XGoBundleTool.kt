package com.xrngo.multibundle

object XGoBundleTool {

    fun getBizAssetsBundleFileName(bundleName: String): String {
        return "index.${bundleName}.bundle"
    }

}