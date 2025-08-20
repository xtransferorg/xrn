package xrn.modules.multibundle.devsupport

import android.annotation.SuppressLint
import android.app.AlertDialog
import android.content.Context
import android.widget.Toast
import com.blankj.utilcode.util.ThreadUtils
import com.facebook.common.logging.FLog
import com.facebook.debug.holder.PrinterHolder
import com.facebook.debug.tags.ReactDebugOverlayTags
import com.facebook.infer.annotation.Assertions
import com.facebook.react.R
import com.facebook.react.ReactInstanceManager
import com.facebook.react.ReactRootView
import com.facebook.react.bridge.JSBundleLoader
import com.facebook.react.bridge.JavaJSExecutor
import com.facebook.react.bridge.ReactMarker
import com.facebook.react.bridge.ReactMarkerConstants
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.common.SurfaceDelegateFactory
import com.facebook.react.common.futures.SimpleSettableFuture
import com.facebook.react.devsupport.DevInternalSettings
import com.facebook.react.devsupport.DevServerHelper
import com.facebook.react.devsupport.DevSupportManagerBase
import com.facebook.react.devsupport.HMRClient
import com.facebook.react.devsupport.InspectorPackagerConnection.BundleStatus
import com.facebook.react.devsupport.InspectorPackagerConnection.BundleStatusProvider
import com.facebook.react.devsupport.ReactInstanceDevHelper
import com.facebook.react.devsupport.WebsocketJavaScriptExecutor
import com.facebook.react.devsupport.WebsocketJavaScriptExecutor.JSExecutorConnectCallback
import com.facebook.react.devsupport.interfaces.DevBundleDownloadListener
import com.facebook.react.devsupport.interfaces.DevLoadingViewManager
import com.facebook.react.devsupport.interfaces.DevOptionHandler
import com.facebook.react.devsupport.interfaces.DevSplitBundleCallback
import com.facebook.react.devsupport.interfaces.PackagerStatusCallback
import com.facebook.react.devsupport.interfaces.RedBoxHandler
import com.facebook.react.packagerconnection.PackagerConnectionSettings
import com.facebook.react.packagerconnection.RequestHandler
import xrn.modules.multibundle.Utils
import xrn.modules.multibundle.bundle.RNHostManager
import java.io.File
import java.io.IOException
import java.lang.reflect.Field
import java.util.concurrent.ExecutionException
import java.util.concurrent.TimeUnit
import java.util.concurrent.TimeoutException

/**
 * XDevSupportManager is a custom implementation extending DevSupportManagerBase.
 * It manages developer support features such as error handling, reload,
 * and debugging tools during development.
 */
class XDevSupportManager @SuppressLint("VisibleForTests") constructor(
    bundleName: String,
    applicationContext: Context,
    reactInstanceManagerHelper: ReactInstanceDevHelper?,
    packagerPathForJSBundleName: String?,
    enableOnCreate: Boolean,
    redBoxHandler: RedBoxHandler?,
    devBundleDownloadListener: DevBundleDownloadListener?,
    minNumShakes: Int,
    customPackagerCommandHandlers: Map<String?, RequestHandler?>?,
    surfaceDelegateFactory: SurfaceDelegateFactory?,
    devLoadingViewManager: DevLoadingViewManager?
) : DevSupportManagerBase(
    applicationContext,
    reactInstanceManagerHelper,
    packagerPathForJSBundleName,
    enableOnCreate,
    redBoxHandler,
    devBundleDownloadListener,
    minNumShakes,
    customPackagerCommandHandlers,
    surfaceDelegateFactory,
    devLoadingViewManager
) {
    /**
     * Flag to indicate whether sampling profiler is enabled
     */
    private var mIsSamplingProfilerEnabled = false

    /**
     * React Native instance manager for managing JS runtime lifecycle
     */
    private var mReactInstanceManager: ReactInstanceManager? = null

    /**
     * bundle name
     */
    private var mBundleName = ""

    /**
     * Internal development settings, initialized in constructor
     */
    private var mDevInternalSettings: XDevInternalSettings? = null

    /**
     * Returns the ReactInstanceDevHelper instance by delegating to the superclass.
     */
    public override fun getReactInstanceDevHelper(): ReactInstanceDevHelper {
        return super.getReactInstanceDevHelper()
    }

    /**
     * Sets the ReactInstanceManager instance.
     *
     * @param reactInstanceManager The ReactInstanceManager to be set.
     */
    fun setReactInstanceManager(reactInstanceManager: ReactInstanceManager?) {
        mReactInstanceManager = reactInstanceManager
    }

    /**
     * Checks asynchronously if the development packager server is running,
     * and returns the result via the provided callback.
     *
     * @param callback The callback to receive the packager status.
     */
    override fun isPackagerRunning(callback: PackagerStatusCallback) {
        super.isPackagerRunning { b ->
            packagerRunningStatus = b
            callback.onPackagerStatusFetched(b)
        }
    }

    /**
     * Checks whether the development packager server is currently running.
     *
     * @return true if the packager server is running; false otherwise.
     */
    var packagerRunningStatus: Boolean = false
        private set

    init {
        mBundleName = bundleName
        try {
            var devSettingsFiled: Field? = null
            var devServerHelperFiled: Field? = null
            var packagerConnectSettingsFiled: Field? = null

            val params = RNHostManager.getParams()
            val localXDevInternalSettings: XDevInternalSettings? = params?.devSupportParams?.createDevInternalSettings?.invoke(bundleName, applicationContext)
            val listenerLocal = DevInternalSettings.Listener { this@XDevSupportManager.reloadSettings() }
            mDevInternalSettings = localXDevInternalSettings ?: XDevInternalSettings(bundleName, applicationContext, listenerLocal)
            devSettingsFiled = DevSupportManagerBase::class.java.getDeclaredField("mDevSettings")
            devSettingsFiled.isAccessible = true
            devSettingsFiled.set(this, mDevInternalSettings)

            val mPackagerConnectionSettings: PackagerConnectionSettings = XPackageConnectionSettings(applicationContext, bundleName)
            packagerConnectSettingsFiled = DevInternalSettings::class.java.getDeclaredField("mPackagerConnectionSettings")
            packagerConnectSettingsFiled.isAccessible = true
            packagerConnectSettingsFiled.set(mDevInternalSettings, mPackagerConnectionSettings)

            val bundleStatusField = DevSupportManagerBase::class.java.getDeclaredField("mBundleStatus")
            bundleStatusField.isAccessible = true
            val bundleStatus = bundleStatusField.get(this) as? BundleStatus
            val bundleStatusProvider = BundleStatusProvider { bundleStatus }
            var devServerHelper: DevServerHelper? = params?.devSupportParams?.createDevServerHelper?.invoke(bundleName, mDevInternalSettings, applicationContext.packageName, bundleStatusProvider)
            if (devServerHelper == null) {
                devServerHelper = XDevServerHelper(
                    bundleName,
                    mDevInternalSettings,
                    applicationContext.packageName,
                    bundleStatusProvider
                )
            }
            devServerHelperFiled = DevSupportManagerBase::class.java.getDeclaredField("mDevServerHelper")
            devServerHelperFiled.isAccessible = true
            devServerHelperFiled.set(this, devServerHelper)
        } catch (e: Exception) {
            Utils.handleException(e, false)
        }
    }

    override fun getUniqueTag(): String {
        return "Bridge"
    }

    /**
     * Loads a split JavaScript bundle from the development server.
     *
     * @param bundlePath The path or name of the split bundle to load.
     * @param callback Callback to notify about success or failure of the load operation.
     */
    override fun loadSplitBundleFromServer(bundlePath: String, callback: DevSplitBundleCallback) {
        this.fetchSplitBundleAndCreateBundleLoader(bundlePath, object : CallbackWithBundleLoader {
            override fun onSuccess(bundleLoader: JSBundleLoader) {
                bundleLoader.loadScript(
                    this@XDevSupportManager.currentContext?.catalystInstance
                )
                (this@XDevSupportManager.currentContext?.getJSModule(
                    HMRClient::class.java
                ) as? HMRClient)?.registerBundle(
                    this@XDevSupportManager.devServerHelper.getDevServerSplitBundleURL(
                        bundlePath
                    )
                )
                callback.onSuccess()
            }

            override fun onError(url: String, cause: Throwable) {
                callback.onError(url, cause)
            }
        })
    }

    private fun getExecutorConnectCallback(future: SimpleSettableFuture<Boolean?>): JSExecutorConnectCallback {
        return object : JSExecutorConnectCallback {
            override fun onSuccess() {
                future.set(true)
                this@XDevSupportManager.hideDevLoadingView()
            }

            override fun onFailure(cause: Throwable) {
                this@XDevSupportManager.hideDevLoadingView()
                FLog.e("ReactNative", "Failed to connect to debugger!", cause)
                future.setException(
                    IOException(
                        this@XDevSupportManager.applicationContext.getString(
                            R.string.catalyst_debug_error
                        ), cause
                    )
                )
            }
        }
    }

    /**
     * Reloads the JavaScript bundle while running in proxy mode.
     *
     * In proxy mode, the JS bundle is loaded through a proxy server
     * which may provide features like caching, debugging, or hot reloading.
     */
    private fun reloadJSInProxyMode() {
        this.devServerHelper.launchJSDevtools()
        val factory = JavaJSExecutor.Factory {
            val executor = WebsocketJavaScriptExecutor()
            val future: SimpleSettableFuture<Boolean?> = SimpleSettableFuture<Boolean?>()
            executor.connect(
                this@XDevSupportManager.devServerHelper.websocketProxyURL,
                this@XDevSupportManager.getExecutorConnectCallback(future)
            )
            try {
                future.get(90L, TimeUnit.SECONDS)
                return@Factory executor
            } catch (var4: ExecutionException) {
                throw (var4.cause as Exception?)!!
            } catch (var5: TimeoutException) {
                throw RuntimeException(var5)
            } catch (var5: InterruptedException) {
                throw RuntimeException(var5)
            }
        }
        this.reactInstanceDevHelper.onReloadWithJSDebugger(factory)
    }

    /**
     * Handles the reload of JavaScript bundle.
     * Typically called when developer requests a reload or when the bundle updates.
     */
    override fun handleReloadJS() {
        UiThreadUtil.assertOnUiThread()
        ReactMarker.logMarker(
            ReactMarkerConstants.RELOAD,
            this.devSettings.packagerConnectionSettings.debugServerHost
        )
        this.hideRedboxDialog()
        this.isPackagerRunning { b: Boolean ->
            // Do nothing; only update the packagerRunningStatus
        }
        if (this.devSettings.isRemoteJSDebugEnabled) {
            PrinterHolder.getPrinter()
                .logMessage(ReactDebugOverlayTags.RN_CORE, "RNCore: load from Proxy")
            this.showDevLoadingViewForRemoteJSEnabled()
            this.reloadJSInProxyMode()
        } else {
            PrinterHolder.getPrinter()
                .logMessage(ReactDebugOverlayTags.RN_CORE, "RNCore: load from Server")
            val bundleURL = this.devServerHelper.getDevServerBundleURL(
                Assertions.assertNotNull(
                    this.jsAppBundleName
                ) as String
            )

            val params = RNHostManager.getParams()
            if (params?.rnHostParams?.isSplitMode?.invoke(mBundleName) == true) {
                this.reloadJSFromServer(bundleURL) {
                    ThreadUtils.runOnUiThread {
                        unmountReactRootView(mReactInstanceManager)
                        invokeRecreateReactContextInBackgroundFromBundleLoader(mReactInstanceManager)
                    }
                }
            } else {
                this.reloadJSFromServer(bundleURL)
            }
        }
    }

    /**
     * Unmounts the ReactRootView associated with the given ReactInstanceManager.
     * This is useful for cleaning up React Native views and releasing resources.
     *
     * @param manager The ReactInstanceManager managing the React context and views.
     */
    private fun unmountReactRootView(manager: ReactInstanceManager?) {
        try {
            val mAttachedRootViewsField =
                manager?.javaClass?.getDeclaredField("mAttachedReactRoots")
            mAttachedRootViewsField?.isAccessible = true
            val mAttachedRootViews = mAttachedRootViewsField?.get(manager) as? Set<ReactRootView> ?: setOf()
            var first: ReactRootView? = null
            for (reactRootView in mAttachedRootViews) {
                reactRootView.unmountReactApplication()
                first = reactRootView
            }
            first?.unmountReactApplication()
        } catch (e: Exception) {
            Utils.handleException(e, false)
        }
    }

    /**
     * Recreates the ReactContext in the background
     *
     * This method triggers a reload of the React Native context by
     * loading the JS bundle through the specified ReactInstanceManager.
     *
     * @param reactInstanceManager The ReactInstanceManager used to manage ReactContext lifecycle.
     */
    private fun invokeRecreateReactContextInBackgroundFromBundleLoader(reactInstanceManager: ReactInstanceManager?) {
        try {
            val method =
                ReactInstanceManager::class.java.getDeclaredMethod("recreateReactContextInBackgroundFromBundleLoader")
            method.isAccessible = true
            method.invoke(reactInstanceManager)
        } catch (e: Exception) {
            Utils.handleException(e, false)
        }
    }

    /**
     * Toggles the state of the JavaScript sampling profiler.
     *
     * If the profiler is currently enabled, this method disables it.
     * If the profiler is disabled, this method enables it.
     */
    private fun toggleJSSamplingProfiler() {
        val javaScriptExecutorFactory = this.reactInstanceDevHelper.javaScriptExecutorFactory
        if (!this.mIsSamplingProfilerEnabled) {
            try {
                javaScriptExecutorFactory.startSamplingProfiler()
                Toast.makeText(
                    this.applicationContext,
                    "Starting Sampling Profiler",
                    Toast.LENGTH_SHORT
                ).show()
            } catch (var18: UnsupportedOperationException) {
                Toast.makeText(
                    this.applicationContext,
                    "$javaScriptExecutorFactory does not support Sampling Profiler",
                    Toast.LENGTH_LONG
                ).show()
            } finally {
                this.mIsSamplingProfilerEnabled = true
            }
        } else {
            try {
                val outputPath = File.createTempFile(
                    "sampling-profiler-trace",
                    ".cpuprofile",
                    this.applicationContext.cacheDir
                ).path
                javaScriptExecutorFactory.stopSamplingProfiler(outputPath)
                Toast.makeText(
                    this.applicationContext,
                    "Saved results from Profiler to $outputPath",
                    Toast.LENGTH_LONG
                ).show()
            } catch (var15: IOException) {
                FLog.e(
                    "ReactNative",
                    "Could not create temporary file for saving results from Sampling Profiler"
                )
            } catch (var16: UnsupportedOperationException) {
                Toast.makeText(
                    this.applicationContext,
                    javaScriptExecutorFactory.toString() + "does not support Sampling Profiler",
                    Toast.LENGTH_LONG
                ).show()
            } finally {
                this.mIsSamplingProfilerEnabled = false
            }
        }
    }


    var devOptionsDialog: AlertDialog?
        get() {
            var mDevOptionsDialog: AlertDialog? = null
            try {
                var privateField: Field? = null
                privateField =
                    DevSupportManagerBase::class.java.getDeclaredField("mDevOptionsDialog")
                privateField.isAccessible = true
                mDevOptionsDialog = privateField.get(this) as AlertDialog
            } catch (e: Exception) {
                Utils.handleException(e, true)
            }
            return mDevOptionsDialog
        }
        set(dialog) {
            try {
                var privateField: Field? = null
                privateField =
                    DevSupportManagerBase::class.java.getDeclaredField("mDevOptionsDialog")
                privateField?.isAccessible = true
                privateField?.set(this, dialog)
            } catch (e: Exception) {
                Utils.handleException(e, true)
            }
        }

    val customDevOptions: LinkedHashMap<String?, DevOptionHandler?>?
        get() {
            var mCustomDevOptions: LinkedHashMap<String?, DevOptionHandler?>? = null
            try {
                var privateField: Field? = null
                privateField =
                    DevSupportManagerBase::class.java.getDeclaredField("mCustomDevOptions")
                privateField.isAccessible = true
                mCustomDevOptions = privateField.get(this) as LinkedHashMap<String?, DevOptionHandler?>
            } catch (e: Exception) {
                Utils.handleException(e, true)
            }
            return mCustomDevOptions
        }

    fun requestPermission() {
        // 调用 DebugOverlayController 的 requestPermission() 方法
        try {
            val debugOverlayControllerClass =
                Class.forName("com.facebook.react.devsupport.DebugOverlayController")
            val requestPermissionMethod =
                debugOverlayControllerClass.getMethod("requestPermission", Context::class.java)
            requestPermissionMethod.invoke(debugOverlayControllerClass, this.applicationContext)
        } catch (e: Exception) {
            Utils.handleException(RuntimeException("requestPermission occur exception", e), true)
        }
    }

    /**
     * Returns an instance of DevServerHelper responsible for
     * handling development server related operations.
     *
     * Subclasses can override this method to provide a custom implementation.
     *
     * @return DevServerHelper instance for dev server interactions.
     */
    override fun getDevServerHelper(): DevServerHelper {
        return super.getDevServerHelper()
    }


    /**
     * Sets the port number of the debug server host.
     *
     * @param hostPort The port number to connect to the debug server.
     */
    @SuppressLint("VisibleForTests")
    fun setDebugServerHostPort(hostPort: Int) {
        val settings = devSettings.packagerConnectionSettings as XPackageConnectionSettings
        val ip = settings.debugServerIP

        devSettings.packagerConnectionSettings.debugServerHost = "$ip:$hostPort"
    }
}
