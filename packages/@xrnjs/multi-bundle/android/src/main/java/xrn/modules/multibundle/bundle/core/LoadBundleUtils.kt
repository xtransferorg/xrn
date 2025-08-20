package xrn.modules.multibundle.bundle.core

import xrn.modules.multibundle.bundle.RNHostManager

object LoadBundleUtils {

    /**
     * Load built-in bundle from assets.
     */
    const val LOAD_TYPE_ASSET_FILE = 1

    /**
     * Load a normal file (e.g., a hot-update bundle).
     */
    const val LOAD_TYPE_FILE = 2

    /**
     * Load bundle from local development server.
     */
    const val LOAD_TYPE_LOCAL_SERVER = 3

    /**
     * Safely loads a bundle script with error handling.
     *
     * @param bundleName The name of the bundle.
     * @param loadType The type of loading (asset, file, or local server).
     * @param fileName The file path or name, nullable.
     * @param sourceUrl The source URL, nullable.
     * @param loadAction The loading action to run.
     *
     * If the load action throws an exception, the registered failure callback is invoked for business handling.
     */
    fun safeLoadScript(bundleName:String, loadType: Int, fileName: String?, sourceUrl: String?, loadAction: Runnable?) {
        val loadFail = RNHostManager.getParams()?.devSupportParams?.onLoadScriptFail
        try {
            loadAction?.run()
        } catch (e: Exception) {
            loadFail?.invoke(bundleName, loadType, fileName, sourceUrl, e)
        }
    }

}