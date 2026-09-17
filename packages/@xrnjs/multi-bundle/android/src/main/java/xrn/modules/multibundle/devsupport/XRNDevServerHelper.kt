package xrn.modules.multibundle.devsupport

import android.content.Context
import com.blankj.utilcode.util.AppUtils
import com.blankj.utilcode.util.ReflectUtils
import com.blankj.utilcode.util.ResourceUtils
import com.facebook.react.devsupport.BundleDownloader
import com.facebook.react.devsupport.DevServerHelper
import com.facebook.react.devsupport.interfaces.DevBundleDownloadListener
import com.facebook.react.modules.debug.interfaces.DeveloperSettings
import com.facebook.react.packagerconnection.PackagerConnectionSettings
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import xrn.modules.multibundle.ReactHostManager
import java.io.File

open class XRNDevServerHelper(
    val bundleName: String,
    developerSettings: DeveloperSettings,
    val applicationContext: Context,
    packagerConnectionSettings: PackagerConnectionSettings
) : DevServerHelper(developerSettings, applicationContext, packagerConnectionSettings) {

    override fun getSourceUrl(mainModuleName: String?): String {
        val sourceUrl = super.getSourceUrl(mainModuleName)
        //bundleName 在拆包时，可以通过 url 中的 bundleName 判断哪个 bundle 加载好了
        var resultUrl =
            if (sourceUrl.isNullOrEmpty()) sourceUrl else "$sourceUrl&bundleName=${bundleName}"
        if (ReactHostManager.getReactHostDelegate(bundleName).isSplitMode()) {
            //添加参数：版本号
            resultUrl = "$resultUrl&appVersion=${AppUtils.getAppVersionName()}"
        }

        resultUrl = resultUrl.replace("lazy=true", "lazy=false")

        return resultUrl
    }

    override fun getDevServerBundleURL(jsModulePath: String?): String {
        //bundleName 在拆包时，可以通过 url 中的 bundleName 判断哪个 bundle 加载好了
        var url = super.getDevServerBundleURL(jsModulePath) + "&bundleName=${bundleName}"
        if (ReactHostManager.getReactHostDelegate(bundleName).isSplitMode()) {
            //添加参数：版本号
            url = "$url&appVersion=${AppUtils.getAppVersionName()}"
        }

        url = url.replace("lazy=true", "lazy=false")

        return url
    }

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
                .reflect(this@XRNDevServerHelper)
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