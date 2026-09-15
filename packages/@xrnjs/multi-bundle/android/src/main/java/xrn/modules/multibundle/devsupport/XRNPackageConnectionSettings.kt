package xrn.modules.multibundle.devsupport

import android.content.Context
import androidx.core.content.edit
import com.facebook.common.logging.FLog
import com.facebook.infer.annotation.Assertions
import com.facebook.react.modules.systeminfo.AndroidInfoHelpers
import com.facebook.react.packagerconnection.PackagerConnectionSettings

class XRNPackageConnectionSettings(val appContext: Context, val bundleName: String) :
    PackagerConnectionSettings(appContext) {

    private val spCache by lazy {
        getDebugPreferences(appContext)
    }

    private val bundleHostSPKey: String
        get() = "$bundleName:debug_http_host";

    override var debugServerHost: String
        get() {
            val host = spCache.getString(bundleHostSPKey, null)

            if (!host.isNullOrEmpty()) {
                val inputIp = getDebugServerIP()
                if (!inputIp.isNullOrEmpty() && !host.contains(inputIp)) {
                    val newIp = "$inputIp:" + host.split(":".toRegex())
                        .dropLastWhile { it.isEmpty() }.toTypedArray()[1]
                    spCache.edit { putString(bundleHostSPKey, newIp) }
                    return newIp
                }

                return Assertions.assertNotNull<String>(host)
            } else {
                val host = AndroidInfoHelpers.getServerHost(appContext)
                if (host == "localhost") {
                    FLog.w(
                        TAG,
                        "You seem to be running on device. Run '" + AndroidInfoHelpers.getAdbReverseTcpCommand(
                            appContext
                        ) + "' to forward the debug server's port to the device."
                    )
                }

                return host
            }
        }
        set(value) {
            spCache.edit { putString(bundleHostSPKey, value) }
        }

    fun setDebugServerIP(host: String?) {
        spCache.edit { putString(PREFS_DEBUG_SERVER_IP_KEY, host) }
    }

    fun getDebugServerIP(): String? {
        val ip = spCache.getString(PREFS_DEBUG_SERVER_IP_KEY, null)
        if (!ip.isNullOrBlank()) {
            return Assertions.assertNotNull<String>(ip)
        } else {
            val host = AndroidInfoHelpers.getServerHost(appContext)
            if (host == "localhost") {
                FLog.w(
                    TAG,
                    "You seem to be running on device. Run '" + AndroidInfoHelpers.getAdbReverseTcpCommand(
                        appContext
                    ) + "' to forward the debug server's port to the device."
                )
            }
            return host.split(":".toRegex()).dropLastWhile { it.isEmpty() }.toTypedArray()[0]
        }
    }

    companion object {
        private val TAG = XRNPackageConnectionSettings::class.java.simpleName

        const val PREFS_DEBUG_SERVER_IP_KEY = "debug_http_IP"

        const val XRN_DEBUG_SP_NAME = "XRN_DEV_SUPPORT"

        fun getDebugPreferences(context: Context) =
            context.getSharedPreferences(XRN_DEBUG_SP_NAME, Context.MODE_PRIVATE)
    }
}
