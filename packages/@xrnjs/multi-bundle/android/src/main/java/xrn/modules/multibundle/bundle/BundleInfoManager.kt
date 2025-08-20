package xrn.modules.multibundle.bundle

import android.content.Context
import androidx.annotation.RawRes
import java.io.BufferedReader
import java.io.InputStreamReader
import com.blankj.utilcode.util.GsonUtils
import xrn.modules.multibundle.Utils

/**
 * Singleton manager for handling bundle information.
 */
object BundleInfoManager {
    const val TAG = "BundleInfoManager"

    /**
     * Indicates whether the manager has been initialized.
     */
    @Volatile
    private var isInitialized = false

    /**
     * Configuration options used during initialization.
     *
     * Set via the [init] method. Can be null if not yet initialized.
     */
    private var options: BundleInfoManagerOptions? = null

    /**
     * Optional hook for customizing bundle info behavior.
     */
    private var hook: BundleInfoHook? = null

    /**
     * Array of all registered bundle information.
     */
    private var BUNDLE_INFOS: Array<BundleInfo> = arrayOf()

    /**
     * Map from bundle name to its corresponding BundleInfo.
     */
    private val bundleInfoMap = mutableMapOf<String, BundleInfo>();

    /**
     * Initializes the BundleInfoManager with the given options and hook.
     *
     * @param options Configuration options for initialization.
     * @param hook Optional hook for intercepting or customizing bundle info.
     */
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

            val bundleInfo = BundleInfo(option.bundleName, bundleType, option.defaultModuleName, option.moduleNames, option.codePushKey, option.port)
            bundleInfo.setHook(hook)
            if (bundleInfoMap.containsKey(bundleInfo.bundleName)) {
                throw IllegalArgumentException("${TAG}.constructor:bundle name has set, info.bundleName=${bundleInfo.bundleName}")
            }
            bundleInfoMap[bundleInfo.bundleName] = bundleInfo
            return@map bundleInfo
        } ?: listOf()
        BUNDLE_INFOS = bundleInfos.toTypedArray()
    }

    /**
     * Initializes the BundleInfoManager using a raw config file.
     *
     * @param context Application context.
     * @param rawRes Resource ID pointing to a raw JSON file containing bundle information.
     * @param hook Optional hook for customizing or intercepting bundle info processing.
     */
    fun initWithRawFile(context: Context, @RawRes rawRes: Int, hook: BundleInfoHook? = null) {
        Utils.assertFalse(this.isInitialized, "${TAG}.initWithRawFile:BundleInfoManager has initialized")
        loadOptionsFromRawFile(context, rawRes, hook)
    }

    private fun loadOptionsFromRawFile(context: Context, @RawRes rawRes: Int, hook: BundleInfoHook?) {
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

    /**
     * Returns a list of all registered bundle information.
     */
    fun getAllBundleInfo(): List<BundleInfo> {
        Utils.assertTrue(this.isInitialized, "${TAG}.getAllBundleInfo:BundleInfoManager has not initialized")
        return BUNDLE_INFOS.toList()
    }

    /**
     * Returns the [BundleInfo] associated with the given bundle name.
     *
     * @param bundleName The name of the bundle to look up.
     * @return The corresponding [BundleInfo], or null if not found or bundleName is null.
     */
    fun getBundleInfo(bundleName: String?): BundleInfo? {
        Utils.assertTrue(this.isInitialized, "${TAG}.getBundleInfo:BundleInfoManager has not initialized")
        return this.bundleInfoMap[bundleName ?: ""]
    }

    /**
     * Checks if a bundle with the given name is registered.
     *
     * @param bundleName The name of the bundle to check.
     * @return True if the bundle is registered, false otherwise.
     */
    fun isBundleRegistered(bundleName: String): Boolean {
        Utils.assertTrue(this.isInitialized, "${TAG}.isBundleRegistered:BundleInfoManager has not initialized")
        return this.getBundleInfo(bundleName) != null
    }

    /**
     * Returns the main (primary) BundleInfo, if available.
     *
     * @return The main BundleInfo, or null if none is set.
     */
    fun getMainBundleInfo(): BundleInfo? {
        Utils.assertTrue(this.isInitialized, "${TAG}.getMainBundleInfo:BundleInfoManager has not initialized")
        val mainBundle: BundleInfo? = this.BUNDLE_INFOS.find { bundleInfo ->
            bundleInfo.isMainBundle()
        }
        return mainBundle
    }

    /**
     * Finds the BundleInfo associated with the specified port.
     *
     * @param port The port number to look up.
     * @return The corresponding BundleInfo if found, or null otherwise.
     */
    fun findBundleInfoByPort(port: Int): BundleInfo? {
        return bundleInfoMap.values.find { it.getPort() == port }
    }
}

/**
 * BundleInfoManager options
 */
class BundleInfoManagerOptions {
    /**
     * project info
     */
    var project: ProjectInfoOption? = null

    /**
     * Array of bundle options currently configured or available.
     */
    var bundles: Array<BundleInfoOption> = arrayOf()
}

/**
 * project info
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
     * bundle type
     */
    var bundleType: String = ""
    /**
     * default module name
     */
    var defaultModuleName: String = ""
    /**
     * Array of module names managed.
     */
    var moduleNames: Array<String> = arrayOf()
    /**
     * CodePush deployment key
     */
    var codePushKey: String = ""
    /**
     * local server port
     * default value is 8081
     */
    var port: Int = 8081
}