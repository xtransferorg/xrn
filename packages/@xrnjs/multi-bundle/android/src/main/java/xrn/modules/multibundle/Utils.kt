package xrn.modules.multibundle

import android.content.Context
import android.preference.PreferenceManager
import xrn.modules.multibundle.bundle.RNHostManager

object Utils {

    const val UNKNOWN_BUNDLE_NAME = "unknown"

    const val PREFS_DEBUG_SERVER_IP_KEY: String = "debug_http_IP"

    /**
     * Asserts that the given value is true.
     * Throws an error with the given message if the value is false.
     *
     * @param value Boolean value to check.
     * @param msg Error message to throw if the assertion fails.
     */
    fun assertTrue(value: Boolean, msg: String?) {
        if (!value) {
            throw Error(msg)
        }
    }

    /**
     * Asserts that the given value is false.
     * Throws an error with the provided message if the value is true.
     *
     * @param value Boolean value to check.
     * @param msg Error message to throw if the assertion fails.
     */
    fun assertFalse(value: Boolean, msg: String) {
        if (value) {
            throw Error(msg)
        }
    }

    /**
     * Checks whether a file exists in the assets directory.
     *
     * @param context Context used to access the assets.
     * @param dir Relative path to the directory inside the assets folder.
     * @param fileName Name of the file to check within the specified directory.
     * @return True if the file exists; false otherwise.
     */
    fun isAssetsFileExist(context: Context?, dir: String?, fileName: String?): Boolean {
        val fileList = context?.assets?.list(dir ?: "")
        return fileList?.contains(fileName ?: "") == true
    }

    /**
     * Get the IP address of the server
     */
    fun getLocalIPServer(context: Context?): String {
        val sp = PreferenceManager.getDefaultSharedPreferences(context)
        return sp.getString(PREFS_DEBUG_SERVER_IP_KEY, "") ?: ""
    }

    /**
     * Set the IP address of the server
     */
    fun setLocalIPServer(context: Context?, localIP: String) {
        val sp = PreferenceManager.getDefaultSharedPreferences(context)
        sp.edit().putString(PREFS_DEBUG_SERVER_IP_KEY, localIP).apply()
    }

    /**
     * Extracts the bundle name from the given file name.
     *
     * @param fileName The name of the file (can be null).
     * @return The extracted bundle name as a String.
     */
    fun getBundleNameByFileName(fileName: String?): String {
        if (fileName.isNullOrEmpty()) {
            return UNKNOWN_BUNDLE_NAME
        }
        // In development mode, use the local server
        if (RNHostManager.getParams()?.isProd == false && fileName.contains("index.bundle?")) {

            val arguments = fileName.split("&")
            val bundleNameArg = arguments.find { it.startsWith("bundleName=") }
            var index = -1
            if (!bundleNameArg.isNullOrEmpty()) {
                index = bundleNameArg.indexOf("=")
                if (index >= 0 && bundleNameArg.length >= (index + 1)) {
                    return bundleNameArg.substring(index + 1)
                }
            }
        }

        return fileName.replace("/", "")
            .replace("index.", "")
            .replace(".bundle", "")
    }

    /**
     * Handles the given exception by printing its stack trace and optionally re-throwing it.
     *
     * @param e The exception to handle. Can be null.
     * @param reThrow If true, the exception will be re-thrown after logging.
     */
    fun handleException(e: Exception?, reThrow: Boolean) {
        e?.let {
            e.printStackTrace()
            if (reThrow) {
                throw e
            }
        }
    }
}