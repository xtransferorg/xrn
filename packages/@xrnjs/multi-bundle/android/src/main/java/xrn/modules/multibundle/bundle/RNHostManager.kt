package xrn.modules.multibundle.bundle

import android.app.Application
import android.content.Context
import com.facebook.react.JSEngineResolutionAlgorithm
import com.facebook.react.ReactInstanceManagerBuilder
import com.facebook.react.ReactPackage
import com.facebook.react.ReactPackageTurboModuleManagerDelegate
import com.facebook.react.bridge.JSIModulePackage
import com.facebook.react.bridge.JavaScriptExecutorFactory
import com.facebook.react.common.SurfaceDelegateFactory
import com.facebook.react.devsupport.InspectorPackagerConnection
import com.facebook.react.devsupport.interfaces.DevLoadingViewManager
import com.facebook.react.devsupport.interfaces.RedBoxHandler
import xrn.modules.multibundle.Utils
import xrn.modules.multibundle.bundle.core.BundleMarker
import xrn.modules.multibundle.devsupport.XDevInternalSettings
import xrn.modules.multibundle.devsupport.XDevServerHelper
import xrn.modules.multibundle.devsupport.XDevSupportManagerFactory


/**
 * Used to create RNHost (internally holds ReactNativeManager).
 */
abstract class RNHostParams {

    /**
     * Whether split-bundle mode is enabled.
     */
    open val isSplitMode: ((bundleName: String) -> Boolean)? = null

    /**
     * Get business bundle file path
     * Business bundle used in split-bundle mode.
     */
    open val getBizJSBundleFile: ((info: BundleInfo, isSplitMode: Boolean) -> String?)? = null

    /**
     * Custom creation of ReactInstanceManager on the business side.
     * If this method returns a non-null ReactInstanceManagerBuilder,
     * that builder will be used directly to create the ReactInstanceManager,
     * and other properties will be ignored.
     */
    open val createBuilder: ((info: BundleInfo) -> ReactInstanceManagerBuilder?)? = null

    /**
     * JS entry file.
     */
    open val getJSMainModuleName: ((info: BundleInfo, isSplitMode: Boolean) -> String)? = null

    /**
     * Get JS Bundle file path.
     */
    open val getJSBundleFile: ((info: BundleInfo, isSplitMode: Boolean) -> String?)? = null

    /**
     * Built-in asset JS bundle file name.
     */
    open val getBundleAssetName: ((info: BundleInfo, isSplitMode: Boolean) -> String?)? = null

    /**
     * ReactPackage instances.
     */
    open val getPackage: ((info: BundleInfo) -> List<ReactPackage>?)? = null

    /**
     * Whether developer mode is enabled.
     */
    open val getUseDeveloperSupport: ((info: BundleInfo) -> Boolean)? = null

    /**
     * Used to create DevSupportManager.
     */
    open val getDevSupportManagerFactory: ((info: BundleInfo) -> XDevSupportManagerFactory?)? = null

    /**
     * LoadingView in developer mode.
     */
    open val getDevLoadingViewManager: ((info: BundleInfo) -> DevLoadingViewManager?)? = null

    /**
     * Indicates whether an activity is required.
     */
    open val getShouldRequireActivity: ((info: BundleInfo) -> Boolean)? = null

    /**
     * Used to create SurfaceDelegate.
     */
    open val getSurfaceDelegateFactory: ((info: BundleInfo) -> SurfaceDelegateFactory?)? = null

    /**
     * Whether ViewManager is lazily loaded.
     */
    open val getLazyViewManagersEnabled: ((info: BundleInfo) -> Boolean)? = null

    /**
     * RedBox error handler.
     */
    open val getRedBoxHandler: ((info: BundleInfo) -> RedBoxHandler?)? = null

    /**
     * Used to create JavaScriptExecutor.
     */
    open val getJavaScriptExecutorFactory: ((info: BundleInfo) -> JavaScriptExecutorFactory?)? = null

    /**
     * JSI Module package.
     */
    open val getJSIModulePackage: ((info: BundleInfo) -> JSIModulePackage?)? = null

    /**
     * Builder for ReactPackageTurboModuleManagerDelegate.
     */
    open val getReactPackageTurboModuleManagerDelegateBuilder: ((info: BundleInfo) -> ReactPackageTurboModuleManagerDelegate.Builder?)? = null

    /**
     * Gets the JSEngineResolutionAlgorithm.
     */
    open val getJSEngineResolutionAlgorithm: ((info: BundleInfo) -> JSEngineResolutionAlgorithm?)? = null

}

/**
 * Development mode configuration parameters.
 */
open class DevSupportParams {

    /**
     * Creates a DevInternalSettings instance.
     *
     * @param bundleName The name of the bundle.
     * @param context Android context.
     */
    open val createDevInternalSettings: ((bundleName: String, context: Context) -> XDevInternalSettings?)? = null

    /**
     * Creates a DevServerHelper instance.
     *
     * @param bundleName The name of the bundle.
     * @param devInternalSettings Development internal settings.
     * @param pkgName The package name.
     * @param bundleStatusProvider Provides the current bundle status for dev tools.
     */
    open val createDevServerHelper: ((bundleName: String, devInternalSettings: XDevInternalSettings?, pkgName: String, bundleStatusProvider: InspectorPackagerConnection.BundleStatusProvider?) -> XDevServerHelper?)? = null

    /**
     * Callback when the local development server is unavailable.
     *
     * @param bundleName The name of the affected bundle.
     */
    open var onLocalServerUnavailable: ((String) -> Unit)? = null

    /**
     * Callback when loading a JavaScript bundle fails.
     *
     * @param bundleName The name of the bundle.
     * @param statusCode HTTP status code returned from the server (if any).
     * @param errorMsg Error message string (optional).
     * @param errorUrl The URL that failed to load (optional).
     * @param exception The exception that occurred during loading.
     */
    open var onLoadScriptFail: ((String, Int, String?, String?, Exception) -> Unit)? = null

}

/**
 *
 */
open class RNHostManagerParams {
    /**
     * Indicates whether the current environment is production.
     */
    var isProd: Boolean = true

    /**
     * Parameters used to create a ReactNativeHost instance.
     */
    var rnHostParams: RNHostParams? = null

    /**
     * Development mode configuration parameters.
     */
    var devSupportParams: DevSupportParams? = null

    /**
     * Global error handler.
     *
     * Internal logic will catch exceptions and delegate to this callback.
     * External callers can decide whether to rethrow the exception.
     *
     * @param e The exception that occurred.
     * @param data Additional context or metadata.
     */
    var onError: ((e: Exception, data: Map<String, Any>) -> Unit)? = null
}

object RNHostManager {

    private val TAG = RNHostManager::class.java.simpleName

    /**
     * Indicates whether the manager has been initialized.
     */
    @Volatile
    private var isInitialized: Boolean = false

    /**
     * Reference to the Application context.
     * Must be assigned during initialization.
     */
    private lateinit var application: Application

    /**
     * Parameters used to configure the RNHostManager.
     */
    private var params: RNHostManagerParams? = null

    /**
     * Mapping from bundle name to its corresponding RNHost wrapper instance.
     */
    private val bundle2RNHostMap = mutableMapOf<String, RNHostWrapper>()
    /**
     * Mapping from bundle name to its runtime state.
     */
    private val bundle2StateMap = mutableMapOf<String, BundleStateWrapper>()

    /**
     * Initializes the RNHostManager with the given application and configuration parameters.
     *
     * @param application The Android Application context.
     * @param params Configuration parameters for RNHostManager.
     */
    fun init(application: Application, params: RNHostManagerParams) {
        Utils.assertFalse(isInitialized, "${TAG}.init:RNInstanceManager has initialized")
        this.application = application
        this.params = params
        BundleMarker.init()
        BundleInfoManager.getAllBundleInfo().forEach { info ->
            createRNHostByBundle(info.bundleName)
            bundle2StateMap[info.bundleName] = BundleStateWrapper(info.bundleName)
        }
    }

    /**
     * Returns the current RNHostManager parameters.
     *
     * @return The [RNHostManagerParams] instance if initialized; otherwise, null.
     */
    fun getParams(): RNHostManagerParams? {
        return params
    }

    /**
     * Returns all registered [RNHostWrapper] instances.
     *
     * @return An array of [RNHostWrapper] objects currently managed.
     */
    fun getAllRNHostWrapper(): Array<RNHostWrapper> {
        return bundle2RNHostMap.values.toTypedArray()
    }

    /**
     * Returns the [RNHostWrapper] associated with the given bundle name.
     *
     * @param bundleName The name of the bundle.
     * @return The corresponding [RNHostWrapper], or null if not found.
     */
    fun getRNHostWrapperByBundle(bundleName: String): RNHostWrapper? {
        return bundle2RNHostMap[bundleName]
    }

    /**
     * Returns the [RNHost] associated with the main bundle.
     *
     * @return The main [RNHost], or null if not initialized or not found.
     */
    fun getMainRNHost(): RNHost? {
        val mainBundle = BundleInfoManager.getMainBundleInfo()
        return getRNHostByBundle(mainBundle?.bundleName ?: "")
    }

    /**
     * Returns the [RNHost] associated with the given bundle name.
     *
     * @param bundleName Name of the bundle
     * @return The corresponding [RNHost], or null if not found
     */
    fun getRNHostByBundle(bundleName: String): RNHost? {
        return getRNHostWrapperByBundle(bundleName)?.rnHost
    }

    /**
     * Retrieves the [RNHost] for the given bundle name,
     * creating a new instance if it does not exist.
     *
     * @param bundleName The name of the bundle.
     * @return The existing or newly created [RNHost], or null if creation fails.
     */
    fun getOrCreateRNHostByBundle(bundleName: String): RNHost? {
        val rnHost = getRNHostByBundle(bundleName)
        return rnHost ?: kotlin.run {
            createRNHostByBundle(bundleName)
            getRNHostByBundle(bundleName)
        }
    }

    /**
     * Creates a new RNHost instance for the specified bundle name.
     *
     * @param bundleName The name of the bundle for which to create the RNHost.
     */
    private fun createRNHostByBundle(bundleName: String) {
        val bundleInfo = BundleInfoManager.getBundleInfo(bundleName)
        bundleInfo?.let {
            val rnHost = RNHost(application, it)
            val rnHostWrapper = RNHostWrapper(bundleName, rnHost)
            bundle2RNHostMap[bundleName] = rnHostWrapper
        }
    }

    /**
     * Retrieves the [BundleState] associated with the given bundle name.
     *
     * @param bundleName The name of the bundle, nullable.
     * @return The corresponding [BundleState], or null if not found or if bundleName is null.
     */
    fun getBundleState(bundleName: String?): BundleState? {
        return this.getBundleStateWrapper(bundleName)?.getBundleState()
    }

    /**
     * Retrieves the [BundleStateWrapper] associated with the specified bundle name.
     *
     * @param bundleName The name of the bundle, nullable.
     * @return The corresponding [BundleStateWrapper], or null if not found.
     */
    fun getBundleStateWrapper(bundleName: String?): BundleStateWrapper? {
        return bundle2StateMap[bundleName ?: ""]
    }

    /**
     * Updates the state of the specified bundle.
     *
     * @param bundleName The name of the bundle to update.
     * @param state The new [BundleState] to set.
     */
    fun updateBundleState(bundleName: String, state: BundleState) {
        val bundleStateWrapper = getBundleStateWrapper(bundleName)
        bundleStateWrapper?.setBundleState(state)
    }

    /**
     * Preloads the React Native host associated with the specified bundle name.
     *
     * This triggers the ReactInstanceManager to create the React context in the background.
     *
     * @param bundleName The name of the bundle to preload, nullable.
     */
    fun preLoad(bundleName: String?) {
        val rnHost = getRNHostByBundle(bundleName ?: "")
        rnHost?.reactInstanceManager?.createReactContextInBackground()

    }
}