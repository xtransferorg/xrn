package xrn.modules.network

import android.util.Log
import okhttp3.CacheControl
import okhttp3.Call
import okhttp3.Callback
import okhttp3.HttpUrl.Companion.toHttpUrlOrNull
import okhttp3.Request
import okhttp3.Response
import java.io.IOException

/**
 * 冷启动网络预热：对热更新 host 与 API base host 发起轻量 HEAD，
 * 提前完成 DNS / TCP / TLS，写入共享 ConnectionPool。
 *
 * 须在 [XRNSharedOkHttp.install] 之后调用。
 */
object XRNNetworkWarmupUtil {

    private const val TAG = "XRNNetworkWarmup"

    @Volatile
    private var warmupStarted = false

    /**
     * 对外部传入的 URL 数组执行一次网络预热。
     *
     * 空字符串、非法 URL 会被忽略，重复 URL 只会请求一次。
     * 须在 [XRNSharedOkHttp.install] 之后调用。
     */
    @JvmStatic
    fun performWarmupIfNeeded(urlStrings: Array<String>) {
        val validUrls = urlStrings
            .asSequence()
            .map { it.trim() }
            .filter(String::isNotEmpty)
            .mapNotNull { it.toHttpUrlOrNull() }
            .distinct()
            .toList()

        if (validUrls.isEmpty()) {
            return
        }

        val client = try {
            XRNSharedOkHttp.createWarmupClient()
        } catch (error: Exception) {
            // 未 install 或 client 初始化失败时允许后续重试
            Log.w(TAG, "Failed to create network warmup client", error)
            return
        }

        synchronized(this) {
            if (warmupStarted) {
                return
            }
            warmupStarted = true
        }

        validUrls.forEach { url ->
            startWarmup(url, client)
        }
    }

    private fun startWarmup(url: okhttp3.HttpUrl, client: okhttp3.OkHttpClient) {
        try {
            val request = Request.Builder()
                .url(url)
                .head()
                .cacheControl(CacheControl.FORCE_NETWORK)
                .build()

            client.newCall(request).enqueue(WarmupCallback)
        } catch (error: Exception) {
            // 单个 URL 预热失败不影响其他 URL 和启动流程
            Log.w(TAG, "Failed to warm up $url", error)
        }
    }

    private object WarmupCallback : Callback {
        override fun onFailure(call: Call, e: IOException) {
            // 预热失败不影响启动流程
        }

        override fun onResponse(call: Call, response: Response) {
            response.close()
        }
    }
}
