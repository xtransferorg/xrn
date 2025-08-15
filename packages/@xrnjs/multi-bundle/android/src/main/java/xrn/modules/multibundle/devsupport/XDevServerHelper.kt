package xrn.modules.multibundle.devsupport

import com.blankj.utilcode.util.AppUtils
import com.blankj.utilcode.util.ReflectUtils
import com.blankj.utilcode.util.ResourceUtils
import com.facebook.react.devsupport.BundleDownloader
import com.facebook.react.devsupport.DevInternalSettings
import com.facebook.react.devsupport.DevServerHelper
import com.facebook.react.devsupport.InspectorPackagerConnection
import com.facebook.react.devsupport.interfaces.DevBundleDownloadListener
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import xrn.modules.multibundle.bundle.RNHostManager
import java.io.File

/**
 * XDevServerHelper is a helper class used to manage development server configuration
 * and communication logic within the application.
 */
open class XDevServerHelper(
    protected val bundleName: String,
    protected val settings: XDevInternalSettings?,
    packageName: String,
    bundleStatusProvider: InspectorPackagerConnection.BundleStatusProvider?
) : DevServerHelper(settings, packageName, bundleStatusProvider) {

    /**
     * Returns the full source URL for the JS bundle
     *
     * This method is typically used in development mode to construct the URL
     * pointing to the Metro bundler or a custom dev server.
     *
     * @param mainModuleName The name of the main JS module (e.g., "index").
     * @return The full URL pointing to the JS bundle.
     */
    override fun getSourceUrl(mainModuleName: String?): String {
        val sourceUrl = super.getSourceUrl(mainModuleName)
        // The bundleName parameter in the URL is used during bundle splitting to identify
        // which specific bundle has finished loading.
        // This helps the system track the loading status of multiple bundles.
        var resultUrl = if (sourceUrl.isNullOrEmpty()) sourceUrl else "$sourceUrl&bundleName=${bundleName}"
        if (RNHostManager.getParams()?.rnHostParams?.isSplitMode?.invoke(bundleName) == true) {
            // Add parameter: version number
            resultUrl = "$resultUrl&appVersion=${AppUtils.getAppVersionName()}"
        }
        return resultUrl
    }

    /**
     * Constructs the development server URL for the JavaScript bundle based on the provided JS module path.
     *
     * @param jsModulePath The path or name of the JavaScript module (e.g., "index" or "main").
     *                     If null, defaults to "index".
     * @return The full URL to load the JS bundle from the development server.
     */
    override fun getDevServerBundleURL(jsModulePath: String?): String {
        // The bundleName parameter in the URL is used during bundle splitting to identify
        // which specific bundle has finished loading.
        // This helps the system track the loading status of multiple bundles.
        var url = super.getDevServerBundleURL(jsModulePath) + "&bundleName=${bundleName}"
        if (RNHostManager.getParams()?.rnHostParams?.isSplitMode?.invoke(bundleName) == true) {
            // Add parameter: version number
            url = "$url&appVersion=${AppUtils.getAppVersionName()}"
        }

        return url
    }

    /**
     * Downloads the JavaScript bundle from the specified URL and saves it to the given output file.
     *
     * @param callback A listener to receive download progress and completion events. Can be null.
     * @param outputFile The destination file where the downloaded bundle will be saved.
     * @param bundleURL The URL from which to download the JS bundle.
     * @param bundleInfo Optional additional information about the bundle to assist downloading.
     */
    override fun downloadBundleFromURL(
        callback: DevBundleDownloadListener?,
        outputFile: File,
        bundleURL: String,
        bundleInfo: BundleDownloader.BundleInfo?
    ) {
        CoroutineScope(Dispatchers.Main + Job()).launch {
            val baseLine = withContext(Dispatchers.IO) {
                ResourceUtils.readAssets2String("xrn-manifest.json")
            }

            val body = baseLine.toRequestBody("application/json".toMediaType())

            val requestBuilder = Request.Builder().post(body)

            ReflectUtils
                .reflect(this@XDevServerHelper)
                .field("mBundleDownloader")
                .method(
                    "downloadBundleFromURL",
                    callback,
                    outputFile,
                    bundleURL,
                    bundleInfo,
                    requestBuilder
                )
        }
    }
}