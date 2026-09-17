package xrn.modules.multibundle.runtime

interface JSBundleLoaderListener {
    fun onLoadStart(bundleName: String, commonOnly: Boolean, bundleType: JSBundleType)

    fun onLoadEnd(bundleName: String, commonOnly: Boolean, bundleType: JSBundleType)

    fun onLoadFail(
        bundleName: String,
        commonOnly: Boolean,
        bundleType: JSBundleType,
        error: Throwable
    )
}