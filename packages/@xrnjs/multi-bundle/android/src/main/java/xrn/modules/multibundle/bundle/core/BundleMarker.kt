package xrn.modules.multibundle.bundle.core

import com.blankj.utilcode.util.LogUtils
import com.facebook.react.bridge.ReactMarker
import com.facebook.react.bridge.ReactMarkerConstants
import com.facebook.react.bridge.UiThreadUtil
import xrn.modules.multibundle.Utils
import xrn.modules.multibundle.bundle.RNHostManager

/**
 * Tracks the lifecycle of bundle loading.
 * Mainly used in split-bundle mode to track the lifecycle of business bundle loading,
 * helping to resolve timing issues between business bundle loading and loadApp.
 */
object BundleMarker : ReactMarker.MarkerListener {

    interface BundleListener {
        /**
         * Callback invoked when runJSBundle finishes.
         */
        fun onRunJSBundleEnd()
    }

    // Lazily initialized map of listeners keyed by bundle name.
    // Each entry holds a mutable list of BundleListener instances.
    private val listenerMap by lazy { mutableMapOf<String, MutableList<BundleListener>>() }


    fun init() {
        ReactMarker.addListener(this)
    }

    /**
     * Adds a [BundleListener] for the specified bundle.
     *
     * @param bundleName The name of the bundle to listen for.
     * @param listener The listener to be notified of bundle events.
     */
    @Synchronized
    fun addListener(bundleName: String, listener: BundleListener) {
        val listeners = listenerMap[bundleName] ?: mutableListOf()
        listeners.add(listener)
        this.listenerMap[bundleName] = listeners
    }

    /**
     * Removes a previously added [BundleListener] for the specified bundle.
     *
     * @param bundleName The name of the bundle.
     * @param listener The listener to be removed.
     */
    @Synchronized
    fun removeListener(bundleName: String, listener: BundleListener) {
        val listeners = listenerMap[bundleName] ?: return
        listeners.remove(listener)
    }

    override fun logMarker(name: ReactMarkerConstants, tag: String?, instanceKey: Int) {
        LogUtils.d("[BundleMarker]: name: $name, tag: $tag, instanceKey: $instanceKey")

        if (name == ReactMarkerConstants.REACT_BRIDGE_LOADING_START) {

        }

        when (name) {
            // event start
            ReactMarkerConstants.REACT_BRIDGE_LOADING_START,

            ReactMarkerConstants.CREATE_REACT_CONTEXT_START, ReactMarkerConstants.PROCESS_PACKAGES_START, ReactMarkerConstants.BUILD_NATIVE_MODULE_REGISTRY_START, ReactMarkerConstants.CREATE_CATALYST_INSTANCE_START,

            ReactMarkerConstants.SETUP_REACT_CONTEXT_START -> {
            }

            // event end
            ReactMarkerConstants.REACT_BRIDGE_LOADING_END,

            ReactMarkerConstants.CREATE_REACT_CONTEXT_END, ReactMarkerConstants.PROCESS_PACKAGES_END, ReactMarkerConstants.BUILD_NATIVE_MODULE_REGISTRY_END, ReactMarkerConstants.CREATE_CATALYST_INSTANCE_END,

            ReactMarkerConstants.SETUP_REACT_CONTEXT_END -> {
            }

            // 异步事件 需要单独统计
            ReactMarkerConstants.NATIVE_MODULE_INITIALIZE_START -> {
            }

            ReactMarkerConstants.NATIVE_MODULE_INITIALIZE_END -> {
            }

            ReactMarkerConstants.RUN_JS_BUNDLE_START -> {
                val bundleName = Utils.getBundleNameByFileName(tag)

            }

            // When the RUN_JS_BUNDLE_END event is received,
            // extract the bundle name from the tag and notify listeners that the JS bundle has finished loading.
            ReactMarkerConstants.RUN_JS_BUNDLE_END -> {
                val bundleName = Utils.getBundleNameByFileName(tag)

                notifyJSBundleEnd(bundleName)
            }

            // Event indicating that React Native content has appeared on screen.
            ReactMarkerConstants.CONTENT_APPEARED -> {

            }

            else -> {

            }
        }
    }

    /**
     * /**
     *  * Notifies all registered listeners that the JS bundle for the specified bundle name has finished loading.
     *  *
     *  * @param bundleName The name of the bundle whose JS bundle load has ended.
     *  */
     */
    private fun notifyJSBundleEnd(bundleName: String) {
        UiThreadUtil.runOnUiThread {
            synchronized(BundleMarker) {
                RNHostManager.getBundleStateWrapper(bundleName)?.setBundleLoaded(true)

                listenerMap[bundleName]?.forEach {
                    it.onRunJSBundleEnd()
                }
            }
        }
    }

}