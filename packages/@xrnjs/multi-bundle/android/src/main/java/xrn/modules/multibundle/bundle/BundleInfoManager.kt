package xrn.modules.multibundle.bundle

import android.content.Context
import androidx.annotation.RawRes
import java.io.BufferedReader
import java.io.InputStreamReader
import com.blankj.utilcode.util.GsonUtils
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import xrn.modules.multibundle.Utils

/**
 * BundleInfo 管理器
 */
object BundleInfoManager {

    const val TAG = "BundleInfoManager"

    @Volatile
    private var isInitialized = false

    private var options: BundleInfoManagerOptions? = null
    private var hook: BundleInfoHook? = null

    private var BUNDLE_INFOS: Array<BundleInfo> = arrayOf()

    private val bundleInfoMap = mutableMapOf<String, BundleInfo>();

    private var remoteBundleManager: RemoteBundleHost? = null

    fun init(options: BundleInfoManagerOptions?, hook: BundleInfoHook?) {
        Utils.assertFalse(this.isInitialized, "${TAG}.init:BundleInfoManager has initialized")
        isInitialized = true
        this.options = options
        this.hook = hook
        val bundleInfos: List<BundleInfo> = options?.bundles?.map { option ->
            val bundleType = if (option.bundleType.isNullOrBlank()) {
                BundleType.DEFAULT
            } else {
                BundleType.values().find {
                    it.name.equals(option.bundleType, ignoreCase = true)
                } ?: BundleType.DEFAULT
            }

            val bundleInfo = BundleInfo(
                option.bundleName,
                bundleType,
                option.defaultModuleName,
                option.moduleNames,
                option.codePushKey,
                option.port
            )
            bundleInfo.setHook(hook)
            if (bundleInfoMap.containsKey(bundleInfo.bundleName)) {
                throw IllegalArgumentException("${BundleInfoManager.TAG}.constructor:bundle name has set, info.bundleName=${bundleInfo.bundleName}")
            }
            bundleInfoMap[bundleInfo.bundleName] = bundleInfo
            return@map bundleInfo
        } ?: listOf()
        BUNDLE_INFOS = bundleInfos.toTypedArray()

        register(*DevBundleCache.getDevBundles().toTypedArray())
    }

    fun initWithRawFile(context: Context, @RawRes rawRes: Int, hook: BundleInfoHook? = null) {
        Utils.assertFalse(
            this.isInitialized,
            "${TAG}.initWithRawFile:BundleInfoManager has initialized"
        )
        loadOptionsFromRawFile(context, rawRes, hook)
    }

    private fun loadOptionsFromRawFile(
        context: Context,
        @RawRes rawRes: Int,
        hook: BundleInfoHook?
    ) {
        val stringBuilder = StringBuilder()
        try {
            val inputStream = context.resources.openRawResource(rawRes)
            val reader = BufferedReader(InputStreamReader(inputStream))
            var line: String?
            while ((reader.readLine().also { line = it }) != null) {
                stringBuilder.append(line)
            }
            reader.close()
        } catch (e: Exception) {
            e.printStackTrace()
        }
        val json = stringBuilder.toString()
        val bundleInfosOption = GsonUtils.fromJson(json, BundleInfoManagerOptions::class.java)
        init(bundleInfosOption, hook)
    }

    fun prefetchRemoteBundles() {
        CoroutineScope(Dispatchers.Main).launch {
            val bundles = remoteBundleManager?.getRemoteBundles()
            bundles?.forEach { bundleInfo ->
                registerRemoteBundle(bundleInfo)
            }
        }
    }

    suspend fun getRemoteBundle(bundleName: String): BundleInfo? {
        val localBundleInfo = getBundleInfo(bundleName)
        if (localBundleInfo != null) {
            return localBundleInfo
        }

        val remoteBundleInfo = remoteBundleManager?.getRemoteBundle(bundleName)
        if (remoteBundleInfo != null) {
            registerRemoteBundle(remoteBundleInfo)
            return getBundleInfo(bundleName)
        }

        return null
    }

    fun setRemoteBundleManager(manager: RemoteBundleHost) {
        this.remoteBundleManager = manager
    }

    fun register(bundle: BundleInfo) {
        if (bundleInfoMap.containsKey(bundle.bundleName)) {
            return
        }

        bundleInfoMap[bundle.bundleName] = bundle
        BUNDLE_INFOS = BUNDLE_INFOS + bundle
    }

    fun register(vararg bundle: BundleInfo) {
        bundle.forEach {
            register(it)
        }
    }

    fun registerDevBundle(bundleName: String, port: Int) {
        val bundleInfo = BundleInfo(
            bundleName = bundleName,
            bundleType = BundleType.DEFAULT,
            defaultModuleName = "",
            moduleNames = null,
            codePushKey = null,
            port = port,
        )

        DevBundleCache.addDevBundle(bundleInfo)
        register(bundleInfo)
    }

    fun registerRemoteBundle(bundle: RemoteBundleInfo) {
        register(
            BundleInfo(
                bundleName = bundle.bundleName,
                bundleType = BundleType.DEFAULT,
                defaultModuleName = "",
                moduleNames = null,
                codePushKey = bundle.deploymentKey,
                port = 0,
                deliveryType = bundle.deliveryType
            )
        )
    }

    fun getAllBundleInfo(): List<BundleInfo> {
        Utils.assertTrue(
            this.isInitialized,
            "${TAG}.getAllBundleInfo:BundleInfoManager has not initialized"
        )
        return BUNDLE_INFOS.toList()
    }

    /**
     * 根据 bundleName 获取 BundleInfo
     * @param bundleName
     * @returns
     */
    fun getBundleInfo(bundleName: String?): BundleInfo? {
        Utils.assertTrue(
            this.isInitialized,
            "${TAG}.getBundleInfo:BundleInfoManager has not initialized"
        )
        return this.bundleInfoMap[bundleName ?: ""]
    }

    /**
     * 指定 bundle 是否已注册
     * @param bundleName
     * @returns
     */
    fun isBundleRegistered(bundleName: String): Boolean {
        Utils.assertTrue(
            this.isInitialized,
            "${TAG}.isBundleRegistered:BundleInfoManager has not initialized"
        )
        return this.getBundleInfo(bundleName) != null
    }

    /**
     * 获取 main bundle
     * @returns
     */
    fun getMainBundleInfo(): BundleInfo {
        Utils.assertTrue(
            this.isInitialized,
            "${TAG}.getMainBundleInfo:BundleInfoManager has not initialized"
        )
        val mainBundle: BundleInfo? = this.BUNDLE_INFOS.find { bundleInfo ->
            bundleInfo.isMainBundle()
        }
        return mainBundle ?: this.BUNDLE_INFOS[0]
    }

    /**
     * 根据端口获取 BundleInfo
     */
    fun findBundleInfoByPort(port: Int): BundleInfo? {
        return bundleInfoMap.values.find { it.getPort() == port }
    }
}

/**
 * BundleInfoManager 配置信息
 */
class BundleInfoManagerOptions {
    /**
     * 项目信息
     */
    var project: ProjectInfoOption? = null

    /**
     * Bundle信息
     */
    var bundles: Array<BundleInfoOption> = arrayOf()
}

/**
 * 项目信息
 */
class ProjectInfoOption {
    var name: String = ""
}

/**
 * Bundle信息
 */
class BundleInfoOption {
    /**
     * bundle name
     */
    var bundleName: String = ""

    /**
     * 是否主bundle
     */
    var bundleType: String = ""

    /**
     * 默认 moduleName，main bundle 需要配置
     */
    var defaultModuleName: String = ""

    /**
     * 所有的 bundleName
     */
    var moduleNames: Array<String> = arrayOf()

    /**
     * CodePush Key
     */
    var codePushKey: String = ""

    /**
     * 本地服务端口
     */
    var port: Int = 8081
}