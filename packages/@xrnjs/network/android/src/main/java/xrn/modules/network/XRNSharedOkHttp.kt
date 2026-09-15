package xrn.modules.network

import android.content.Context
import com.facebook.react.modules.network.OkHttpClientFactory
import com.facebook.react.modules.network.OkHttpClientProvider
import com.facebook.react.modules.network.ReactCookieJarContainer
import okhttp3.ConnectionPool
import okhttp3.Dispatcher
import okhttp3.OkHttpClient
import java.util.concurrent.TimeUnit

/**
 * 跨 bundle 共享 ConnectionPool / sslSocketFactory（通过 base client + newBuilder 继承），
 * 同时每个 bundle 使用独立 Dispatcher / CookieJar，避免 requestId 冲突导致互相 cancel。
 * 须在首个 ReactHost / Fresco / NetworkingModule 创建前调用 [install]。
 */
object XRNSharedOkHttp {

    private const val DEFAULT_MAX_REQUESTS_PER_HOST = 8
    private const val WARMUP_TIMEOUT_SECONDS = 5L

    private lateinit var appContext: Context

    @Volatile
    private var maxRequestsPerHost = DEFAULT_MAX_REQUESTS_PER_HOST

    private val connectionPool = ConnectionPool()

    /** 模板 client，不直接发请求；派生 client 与其共享 pool/ssl 等底层组件。 */
    @Volatile
    private var baseClient: OkHttpClient? = null

    @JvmStatic
    @JvmOverloads
    fun install(
        context: Context,
        maxRequestsPerHost: Int = DEFAULT_MAX_REQUESTS_PER_HOST,
    ) {
        appContext = context.applicationContext
        this.maxRequestsPerHost = maxRequestsPerHost.takeIf { it > 0 }
            ?: DEFAULT_MAX_REQUESTS_PER_HOST
        OkHttpClientProvider.setOkHttpClientFactory(OkHttpClientFactory {
            createNetworkClient()
        })
    }

    private fun getOrCreateBaseClient(): OkHttpClient {
        return baseClient ?: synchronized(this) {
            baseClient ?: buildBaseClient().also { baseClient = it }
        }
    }

    private fun buildBaseClient(): OkHttpClient {
        val builder = OkHttpClientProvider.createClientBuilder(appContext)
            .connectionPool(connectionPool)
        return builder.build()
    }

    private fun createNetworkClient(): OkHttpClient {
        // 每个 bundle 一个 Dispatcher：避免 requestId(tag) 冲突导致跨 bundle 误 cancel。
        val dispatcher = Dispatcher().apply {
            maxRequestsPerHost = this@XRNSharedOkHttp.maxRequestsPerHost
        }
        return getOrCreateBaseClient()
            .newBuilder()
            .dispatcher(dispatcher)
            // 每个 bundle 一个 CookieJarContainer：避免 invalidate() 清理影响其他 bundle
            .cookieJar(ReactCookieJarContainer())
            .build()
    }

    /**
     * 冷启动预热用 Client：共享 base 的 Pool / SSL / 拦截器，独立 Dispatcher，2s 超时。
     */
    internal fun createWarmupClient(): OkHttpClient {
        check(::appContext.isInitialized) {
            "XRNSharedOkHttp.install(context) must be called before network warmup"
        }
        return getOrCreateBaseClient()
            .newBuilder()
            .dispatcher(Dispatcher())
            .connectTimeout(WARMUP_TIMEOUT_SECONDS, TimeUnit.SECONDS)
            .readTimeout(WARMUP_TIMEOUT_SECONDS, TimeUnit.SECONDS)
            .writeTimeout(WARMUP_TIMEOUT_SECONDS, TimeUnit.SECONDS)
            .build()
    }
}
