package xrn.modules.multibundle.bundle

import com.facebook.react.BuildConfig
import xrn.modules.multibundle.devsupport.XRNDeveloperSettings


/**
 * Bundle 信息
 * 静态数据
 * @param bundleName bundle 名
 * @param bundleType bundle 类型
 * @param defaultModuleName 默认 module 名
 * @param moduleNames module 名数组
 * @param codePushKey CodePush Key
 * @param port 端口
 */
class BundleInfo(
    val bundleName: String,
    val bundleType: BundleType,
    val defaultModuleName: String,
    moduleNames: Array<String>?,
    codePushKey: String?,
    private var port: Int,
    private val deliveryType: DeliveryType = DeliveryType.INNER
) {

    companion object {
        /**
         * main bundle
         */
        const val BUNDLE_TYPE_MAIN = "main"
    }

    /**
     * 初始 CodePush Key
     */
    private val initCodePushKey: String = codePushKey ?: ""

    /**
     * module name list
     */
    private val moduleNameList = mutableListOf<String>()

    init {
        if (!moduleNames.isNullOrEmpty()) {
            moduleNameList.addAll(moduleNames)
        }
    }

    /**
     * Hook
     */
    private var hook: BundleInfoHook? = null

    /**
     * 是否为主 bundle
     */
    fun isMainBundle(): Boolean {
        return bundleType == BundleType.MAIN
    }

    /**
     * 添加 AppKey
     */
    fun addAppKey(appKey: String?) {
        if (appKey.isNullOrEmpty()) {
            return
        }
        if (!moduleNameList.contains(appKey)) {
            moduleNameList.add(appKey)
        }
    }

    /**
     * 获取 module 名 list
     */
    fun getModuleNames(): List<String> {
        return moduleNameList.toList()
    }

    /**
     * 设置 BundleInfoHook
     */
    fun setHook(hook: BundleInfoHook?) {
        this.hook = hook
    }

    /**
     * 获取初始 CodePush Key
     */
    fun getInitCodePushKey(): String {
        return initCodePushKey
    }

    /**
     * 获取 CodePush Key
     */
    fun getCodePushKey(): String {
        if (BuildConfig.DEBUG
            && XRNDeveloperSettings.instance(bundleName)?.isCodePushEnabled() == false
        ) {
            return ""
        }

        return hook?.hookCodePushKey?.let { it(this) } ?: initCodePushKey
    }

    /**
     * 获取本地服务 端口
     */
    fun getPort(): Int {
        val cachedPort = XRNDeveloperSettings.instance(bundleName)?.getDebugServerPort()
        if (cachedPort != null && cachedPort != XRNDeveloperSettings.DEBUG_SERVER_PORT_DEFAULT) {
            return cachedPort
        }

        return port
    }

    fun setPort(newPort: Int) {
        this.port = newPort
    }
}

enum class BundleType {
    MAIN,
    DEFAULT
}

enum class DeliveryType {
    INNER,
    DYNAMIC
}

/**
 * 特殊信息Hook方法
 */
interface BundleInfoHook {
    val hookCodePushKey: ((info: BundleInfo) -> String)?
}
