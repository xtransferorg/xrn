package xrn.modules.multibundle.bundle

import android.app.Application
import com.blankj.utilcode.util.LogUtils
import com.blankj.utilcode.util.ReflectUtils
import com.facebook.react.JSEngineResolutionAlgorithm
import com.facebook.react.ReactInstanceEventListener
import com.facebook.react.ReactInstanceManager
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.ReactPackageTurboModuleManagerDelegate
import com.facebook.react.bridge.JSIModulePackage
import com.facebook.react.bridge.JavaScriptExecutorFactory
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReactMarker
import com.facebook.react.bridge.ReactMarkerConstants
import com.facebook.react.common.SurfaceDelegateFactory
import com.facebook.react.devsupport.DevSupportManagerFactory
import com.facebook.react.devsupport.interfaces.DevLoadingViewManager
import com.facebook.react.devsupport.interfaces.RedBoxHandler
import xrn.modules.multibundle.bundle.core.BridgeIdleDebugListener
import xrn.modules.multibundle.devsupport.XDevInternalSettings
import xrn.modules.multibundle.devsupport.XDevSupportManager
import xrn.modules.multibundle.bundle.core.LoadBundleUtils

/**
 * Wraps an [RNHost] instance with its associated bundle name.
 *
 * @param bundleName The name of the bundle.
 * @param rnHost The RNHost instance linked to the bundle.
 */
class RNHostWrapper(val bundleName: String, val rnHost: RNHost) {

}

/**
 * Subclass of ReactNativeHost
 *
 * @param application The Android Application context.
 * @param bundleInfo The bundle information associated with this host.
 */
class RNHost(application: Application, val bundleInfo: BundleInfo): ReactNativeHost(application) {

    /**
     * Retrieves the RNHostParams from RNHostManager if initialized.
     */
    private val rnHostParams = RNHostManager.getParams()?.rnHostParams

    /**
     * Overrides the method to create and return a custom ReactInstanceManager.
     * This is the core engine responsible for managing the React Native lifecycle,
     * including loading JS bundles, managing the React context, and handling dev support.
     * The creation logic can be customized via RNHostParams (e.g., builder, packages, JS bundle path).
     */
    override fun createReactInstanceManager(): ReactInstanceManager {
        val outerBuilder = rnHostParams?.createBuilder?.let { it(bundleInfo) }
        val reactInstanceManager: ReactInstanceManager = if (outerBuilder != null) {
            // These two ReactMarker calls must not be removed. They are used for logging lifecycle events.
            // Similar ReactMarker entries also exist inside super.createReactInstanceManager().
            ReactMarker.logMarker(ReactMarkerConstants.BUILD_REACT_INSTANCE_MANAGER_START)
            val local = outerBuilder.build()
            ReactMarker.logMarker(ReactMarkerConstants.BUILD_REACT_INSTANCE_MANAGER_END)
            local
        } else {
            super.createReactInstanceManager()
        }

        ReflectUtils.reflect(reactInstanceManager).field("mBridgeIdleDebugListener", BridgeIdleDebugListener(bundleInfo.bundleName))

        if (reactInstanceManager.devSupportManager is XDevSupportManager) {
            (reactInstanceManager.devSupportManager as XDevSupportManager).setDebugServerHostPort(bundleInfo.getPort())
            (reactInstanceManager.devSupportManager as XDevSupportManager).setReactInstanceManager(reactInstanceManager)
        }

        // Logic for handling split bundle mode
        if (isSplitMode()) {
            // Add ReactInstanceEventListener when creating ReactInstanceManager to handle loading business bundle
            // Prevent missing business bundle loading during recreateReactContextInBackground in other scenarios
            reactInstanceManager.addReactInstanceEventListener(object : ReactInstanceEventListener {
                override fun onReactContextInitialized(context: ReactContext) {
                    val devSupportManager = reactInstanceManager.devSupportManager
                    val devSettings = devSupportManager.devSettings
                    val catalystInstance = reactInstanceManager.currentReactContext?.catalystInstance
                    //load business bundle
                    val bizJSBundleFile =
                        RNHostManager.getParams()?.rnHostParams?.getBizJSBundleFile?.let {
                            it(
                                bundleInfo,
                                isSplitMode()
                            )
                        }
                    LogUtils.d("onReactContextInitialized", "bizJSBundleFile=$bizJSBundleFile")

                    //Scenarios for loading from local server
                    if (reactInstanceManager.devSupportManager.devSupportEnabled) {
                        val packagerIsRunning =
                            (devSupportManager as XDevSupportManager).packagerRunningStatus
                        //handling local service exceptions
                        if (!packagerIsRunning && devSettings is XDevInternalSettings && devSettings.isBundleDebugEnabled()) {
                            RNHostManager.getParams()?.devSupportParams?.onLocalServerUnavailable?.invoke(bundleInfo.bundleName)
                        }
                        if (packagerIsRunning) {
                            // Load the bundle downloaded by the local development server
                            val fileName = devSupportManager.getDownloadedJSBundleFile()
                            val sourceUrl = devSupportManager.getSourceUrl()
                            LoadBundleUtils.safeLoadScript(bundleInfo.bundleName, LoadBundleUtils.LOAD_TYPE_LOCAL_SERVER, fileName, sourceUrl) {
                                catalystInstance?.loadScriptFromFile(
                                    fileName,
                                    sourceUrl,
                                    false
                                )
                            }
                        } else if (devSupportManager.hasUpToDateJSBundleInCache() && !devSettings.isRemoteJSDebugEnabled() && !ReflectUtils.reflect(
                                reactInstanceManager
                            ).field("mUseFallbackBundle").get<Boolean>()
                        ) {
                            val fileName = devSupportManager.getDownloadedJSBundleFile()
                            val sourceUrl = devSupportManager.getSourceUrl()
                            LoadBundleUtils.safeLoadScript(bundleInfo.bundleName, LoadBundleUtils.LOAD_TYPE_LOCAL_SERVER, fileName, sourceUrl) {
                                catalystInstance?.loadScriptFromFile(
                                    fileName,
                                    sourceUrl,
                                    false
                                )
                            }
                        } else {
                            // Load the built-in business bundle
                            val bizJSBundleFileLocal = RNHostManager.getParams()?.rnHostParams?.getBizJSBundleFile?.let {
                                it(
                                    bundleInfo,
                                    isSplitMode()
                                )
                            }
                            LoadBundleUtils.safeLoadScript(bundleInfo.bundleName, LoadBundleUtils.LOAD_TYPE_ASSET_FILE, bizJSBundleFileLocal, bizJSBundleFileLocal) {
                                catalystInstance?.loadScriptFromAssets(
                                    reactInstanceManager.currentReactContext?.assets,
                                    bizJSBundleFileLocal,
                                    false
                                )
                            }

                        }

                        return
                    }

                    //Scenarios where local server is not used
                    if (bizJSBundleFile?.startsWith("assets://") == true) {
                        LoadBundleUtils.safeLoadScript(bundleInfo.bundleName, LoadBundleUtils.LOAD_TYPE_ASSET_FILE, bizJSBundleFile, bizJSBundleFile) {
                            catalystInstance?.loadScriptFromAssets(
                                reactInstanceManager.currentReactContext?.assets,
                                bizJSBundleFile,
                                false
                            )
                        }
                    } else {
                        LoadBundleUtils.safeLoadScript(bundleInfo.bundleName, LoadBundleUtils.LOAD_TYPE_FILE, bizJSBundleFile, bizJSBundleFile) {
                            catalystInstance?.loadScriptFromFile(
                                bizJSBundleFile,
                                bizJSBundleFile,
                                false
                            )
                        }
                    }
                }
            })
        }
        return  reactInstanceManager
    }

    /**
     * Whether split bundle mode is enabled.
     * Default is not split mode.
     */
    fun isSplitMode(): Boolean {
        return rnHostParams?.isSplitMode?.let { it(bundleInfo.bundleName) } ?: false
    }

    /**
     * JavaScript entry file.
     * Defaults to "index".
     */
    override fun getJSMainModuleName(): String {
        val isSplitMode = isSplitMode()
        return rnHostParams?.getJSMainModuleName?.let { it(bundleInfo, isSplitMode) } ?: super.getJSMainModuleName()
    }

    /**
     * Returns the file path of the JS bundle.
     *
     * @return The JS bundle file path, or null if not specified.
     */
    override fun getJSBundleFile(): String? {
        val isSplitMode = isSplitMode()
        return rnHostParams?.getJSBundleFile?.let { it(bundleInfo, isSplitMode) } ?: super.getJSBundleFile()
    }

    /**
     * Returns the name of the bundle in asset dir.
     *
     * @return The asset bundle file name, or null if not specified.
     */
    override fun getBundleAssetName(): String? {
        val isSplitMode = isSplitMode()
        return rnHostParams?.getBundleAssetName?.let { it(bundleInfo, isSplitMode) } ?: super.getBundleAssetName()
    }

    /**
     * Indicates whether developer mode is enabled.
     * Defaults to false.
     */
    override fun getUseDeveloperSupport(): Boolean {
        return rnHostParams?.getUseDeveloperSupport?.let { it(bundleInfo) } ?: false
    }

    /**
     * Returns the list of ReactPackage instances used by this host.
     *
     * @return A mutable list of [ReactPackage] objects.
     */
    override fun getPackages(): MutableList<ReactPackage> {
        return rnHostParams?.getPackage?.let { it(bundleInfo)?.toMutableList() } ?: mutableListOf()
    }

    /**
     * Returns the factory used to create the DevSupportManager.
     *
     * @return An instance of [DevSupportManagerFactory], or null if not provided.
     */
    override fun getDevSupportManagerFactory(): DevSupportManagerFactory? {
        return rnHostParams?.getDevSupportManagerFactory?.let { it(bundleInfo) } ?: super.getDevSupportManagerFactory()
    }

    /**
     * Returns the manager responsible for the development loading view.
     *
     * @return An instance of [DevLoadingViewManager], or null if not provided.
     */
    override fun getDevLoadingViewManager(): DevLoadingViewManager? {
        return rnHostParams?.getDevLoadingViewManager?.let { it(bundleInfo) } ?: super.getDevLoadingViewManager()
    }

    /**
     * Indicates whether an Activity is required.
     *
     * @return true if an Activity is required; otherwise, fallback to the superclass implementation.
     */
    override fun getShouldRequireActivity(): Boolean {
        return rnHostParams?.getShouldRequireActivity?.let { it(bundleInfo) } ?: super.getShouldRequireActivity()
    }

    /**
     * Returns the factory to create a SurfaceDelegate.
     *
     * @return The [SurfaceDelegateFactory] from rnHostParams or the superclass fallback.
     */
    override fun getSurfaceDelegateFactory(): SurfaceDelegateFactory {
        return rnHostParams?.getSurfaceDelegateFactory?.let { it(bundleInfo) } ?: super.getSurfaceDelegateFactory()
    }

    /**
     * Indicates whether lazy loading for ViewManagers is enabled.
     *
     * @return true if lazy loading is enabled; otherwise, fallback to superclass.
     */
    override fun getLazyViewManagersEnabled(): Boolean {
        return rnHostParams?.getLazyViewManagersEnabled?.let { it(bundleInfo) } ?: super.getLazyViewManagersEnabled()
    }

    /**
     * Returns the RedBox error handler.
     *
     * @return The [RedBoxHandler] from rnHostParams or the superclass fallback.
     */
    override fun getRedBoxHandler(): RedBoxHandler? {
        return rnHostParams?.getRedBoxHandler?.let { it(bundleInfo) } ?: super.getRedBoxHandler()
    }

    /**
     * Returns the factory for creating JavaScriptExecutor instances.
     *
     * @return The [JavaScriptExecutorFactory] from rnHostParams or the superclass fallback.
     */
    override fun getJavaScriptExecutorFactory(): JavaScriptExecutorFactory? {
        return rnHostParams?.getJavaScriptExecutorFactory?.let { it(bundleInfo) } ?: super.getJavaScriptExecutorFactory()
    }

    /**
     * Returns the JSI Module package.
     *
     * @return The [JSIModulePackage] from rnHostParams or the superclass fallback.
     */
    override fun getJSIModulePackage(): JSIModulePackage? {
        return rnHostParams?.getJSIModulePackage?.let { it(bundleInfo) } ?: super.getJSIModulePackage()
    }

    /**
     * Returns the builder for ReactPackageTurboModuleManagerDelegate.
     *
     * @return The [ReactPackageTurboModuleManagerDelegate.Builder] from rnHostParams or the superclass fallback.
     */
    override fun getReactPackageTurboModuleManagerDelegateBuilder(): ReactPackageTurboModuleManagerDelegate.Builder? {
        return rnHostParams?.getReactPackageTurboModuleManagerDelegateBuilder?.let { it(bundleInfo) } ?: super.getReactPackageTurboModuleManagerDelegateBuilder()
    }

    /**
     * Returns the JavaScript engine resolution algorithm.
     *
     * @return The [JSEngineResolutionAlgorithm] from rnHostParams or the superclass fallback.
     */
    override fun getJSEngineResolutionAlgorithm(): JSEngineResolutionAlgorithm? {
        return rnHostParams?.getJSEngineResolutionAlgorithm?.let { it(bundleInfo) } ?: super.getJSEngineResolutionAlgorithm()
    }

}