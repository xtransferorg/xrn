package xrn.modules.multibundle.devsupport

import android.content.Context
import android.content.SharedPreferences
import android.preference.PreferenceManager
import android.text.TextUtils
import com.facebook.common.logging.FLog
import com.facebook.infer.annotation.Assertions
import com.facebook.react.modules.systeminfo.AndroidInfoHelpers
import com.facebook.react.packagerconnection.PackagerConnectionSettings

/**
 * Custom implementation of PackagerConnectionSettings.
 * This class can override or extend the behavior of connection settings
 * for the development packager server.
 */
class XPackageConnectionSettings(
    private val appContext: Context,
    private val bundleName: String
) : PackagerConnectionSettings(
    appContext
) {
    private val mPreferences: SharedPreferences = PreferenceManager.getDefaultSharedPreferences(
        appContext
    )

    /**
     * Returns the debug server host address (IP or hostname).
     *
     * @return The host address of the debug server as a String.
     */
    override fun getDebugServerHost(): String {
        val hostFromSettings = this.mPreferences.getString(bundleHostSPKey, null)

        if (!TextUtils.isEmpty(hostFromSettings)) {
            val inputIp = debugServerIP!!
            if (!TextUtils.isEmpty(inputIp) && !hostFromSettings!!.contains(inputIp)) {
                val newIp = inputIp + ":" + hostFromSettings.split(":".toRegex())
                    .dropLastWhile { it.isEmpty() }
                    .toTypedArray()[1]
                debugServerHost = newIp
                return newIp
            }
            return Assertions.assertNotNull(hostFromSettings) as String
        } else {
            val host = AndroidInfoHelpers.getServerHost(this.appContext)
            if (host == "localhost") {
                FLog.w(
                    TAG,
                    "You seem to be running on device. Run '" + AndroidInfoHelpers.getAdbReverseTcpCommand(
                        this.appContext
                    ) + "' to forward the debug server's port to the device."
                )
            }

            return host
        }
    }

    /**
     * Sets the debug server host address (IP or hostname).
     *
     * @param host The host address of the debug server.
     */
    override fun setDebugServerHost(host: String) {
        this.mPreferences.edit().putString(bundleHostSPKey, host).apply()
    }

    val bundleHostSPKey: String
        /**
         * Returns the SharedPreferences key used to store the Bundle Host address.
         *
         * @return The SharedPreferences key string for the bundle host.
         */
        get() = "$bundleName:debug_http_host"


    var debugServerIP: String?
        /**
         * Returns the IP address of the debug server.
         *
         * @return The debug server IP address as a String.
         */
        get() {
            val hostFromSettings =
                this.mPreferences.getString(PREFS_DEBUG_SERVER_IP_KEY, null as String?)
            if (!TextUtils.isEmpty(hostFromSettings)) {
                return Assertions.assertNotNull(hostFromSettings) as String
            } else {
                val host = AndroidInfoHelpers.getServerHost(this.appContext)
                if (host == "localhost") {
                    FLog.w(
                        TAG,
                        "You seem to be running on device. Run '" + AndroidInfoHelpers.getAdbReverseTcpCommand(
                            this.appContext
                        ) + "' to forward the debug server's port to the device."
                    )
                }

                return host.split(":".toRegex()).dropLastWhile { it.isEmpty() }.toTypedArray()[0]
            }
        }
        /**
         * Sets the debug server IP address.
         *
         * @param host The IP address of the debug server.
         */
        set(host) {
            this.mPreferences.edit().putString(PREFS_DEBUG_SERVER_IP_KEY, host).apply()
        }

    companion object {
        private val TAG: String = XPackageConnectionSettings::class.java.simpleName
        const val PREFS_DEBUG_SERVER_IP_KEY: String = "debug_http_IP"
    }
}
