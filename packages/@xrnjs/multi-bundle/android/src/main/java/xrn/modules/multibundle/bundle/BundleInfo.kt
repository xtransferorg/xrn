package xrn.modules.multibundle.bundle


/**
 * Bundle info
 * @param bundleName bundle name
 * @param bundleType bundle type
 * @param defaultModuleName default module name
 * @param moduleNames module names
 * @param codePushKey CodePush deployment key
 * @param port local server port
 */
class BundleInfo(val bundleName: String, val bundleType: BundleType, val defaultModuleName: String, moduleNames: Array<String>?, codePushKey: String?, private val port: Int) {

    companion object {
        /**
         * main bundle
         */
        const val BUNDLE_TYPE_MAIN = "main"
    }

    /**
     * CodePush deployment key in config file
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
     * dynamically hook bundle info at runtime
     */
    private var hook: BundleInfoHook? = null

    /**
     * whether it is the main bundle
     */
    fun isMainBundle(): Boolean {
        return bundleType == BundleType.MAIN
    }

    /**
     * add module name dynamically at runtime.
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
     * get module name list
     */
    fun getModuleNames(): List<String> {
        return moduleNameList.toList()
    }

    /**
     * set BundleInfoHook
     */
    fun setHook(hook: BundleInfoHook?) {
        this.hook = hook
    }

    /**
     * get the CodePush deployment key in config file
     */
    fun getInitCodePushKey(): String {
        return initCodePushKey
    }

    /**
     * get the final CodePush deployment key
     */
    fun getCodePushKey(): String {
        return hook?.hookCodePushKey?.let { it(this) } ?: initCodePushKey
    }

    /**
     * get local server port
     */
    fun getPort(): Int {
        return port
    }
}

/**
 * bundle type enums
 */
enum class BundleType {
    /**
     * main bundle
     */
    MAIN,

    /**
     * default bundle
     */
    DEFAULT
}

/**
 * Dynamically hook bundle info at runtime
 */
interface BundleInfoHook {
    /**
     * hook CodePush deployment key
     */
    val hookCodePushKey: ((info: BundleInfo) -> String)?
}
