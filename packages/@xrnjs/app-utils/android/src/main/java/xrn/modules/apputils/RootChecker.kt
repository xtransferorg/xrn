package xrn.modules.apputils

import android.annotation.SuppressLint
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import com.blankj.utilcode.util.LogUtils
import java.io.BufferedReader
import java.io.File
import java.io.IOException
import java.io.InputStreamReader
import java.nio.charset.Charset
import java.util.Objects

class RootChecker(
    context: Context,
    rootFiles: Array<String> = arrayOf(
        "/system/app/Superuser.apk",
        "/sbin/su",
        "/system/bin/su",
        "/system/xbin/su",
        "/data/local/xbin/su",
        "/data/local/bin/su",
        "/system/sd/xbin/su",
        "/system/bin/failsafe/su",
        "/data/local/su",
        "/su/bin/su",
        "/su/bin",
        "/system/xbin/daemonsu"
    ),
    rootPackages: Array<String> = arrayOf(
        "com.devadvance.rootcloak",
        "com.devadvance.rootcloakplus",
        "com.koushikdutta.superuser",
        "com.thirdparty.superuser",
        "eu.chainfire.supersu",  // SuperSU
        "com.noshufou.android.su" // superuser
    ),
    runtime: Runtime = Runtime.getRuntime()
) {

    private val context: Context =
        Objects.requireNonNull(context, "The application context is required.")

    private val rootFiles: Array<String> =
        Objects.requireNonNull(rootFiles, "The root Files are required.")

    private val rootPackages: Array<String> =
        Objects.requireNonNull(rootPackages, "The root packages are required.")

    private val runtime: Runtime = Objects.requireNonNull(runtime, "The Runtime is required.")

    val isDeviceRooted: Boolean
        /**
         * Check if the device is rooted or not
         * https://medium.com/@thehimanshugoel/10-best-security-practices-in-android-applications-that-every-developer-must-know-99c8cd07c0bb
         *
         * @return whether the device is rooted or not
         */
        get() = checkTestKeys() || checkRootFiles() || checkSUExist() || checkRootPackages()

    /**
     * Android Roms from Google are build with release-key tags. If test-keys are present, this can
     * mean that the Android build on the device is either a developer build or an unofficial Google
     * build.
     *
     * @return whether if it contains test keys or not
     */
    private fun checkTestKeys(): Boolean {
        val buildTags = BuildInfoProvider.getBuildTags()
        return buildTags != null && buildTags.contains("test-keys")
    }

    /**
     * Often the rooted device have the following files . This method will check whether the device is
     * having these files or not
     *
     * @return whether if the root files exist or not
     */
    private fun checkRootFiles(): Boolean {
        for (path in rootFiles) {
            try {
                if (File(path).exists()) {
                    return true
                }
            } catch (e: RuntimeException) {
                LogUtils.e("Error when trying to check if root file $path exists.", e)
            }
        }
        return false
    }

    /**
     * this will check if SU(Super User) exist or not
     *
     * @return whether su exists or not
     */
    private fun checkSUExist(): Boolean {
        var process: Process? = null
        val su = arrayOf("/system/xbin/which", "su")

        try {
            process = runtime.exec(su)

            BufferedReader(InputStreamReader(process.inputStream, UTF_8)).use { reader ->
                return reader.readLine() != null
            }
        } catch (e: IOException) {
            LogUtils.d("SU isn't found on this Device.")
        } catch (e: Throwable) {
            LogUtils.d("Error when trying to check if SU exists.", e)
        } finally {
            process?.destroy()
        }
        return false
    }

    /**
     * some application hide the root status of the android device. This will check for those files
     *
     * @return whether the root packages exist or not
     */
    @SuppressLint("NewApi")
    private fun checkRootPackages(): Boolean {
        val pm = context.packageManager
        if (pm != null) {
            for (pkg in rootPackages) {
                try {
                    if (BuildInfoProvider.getSdkInfoVersion() >= Build.VERSION_CODES.TIRAMISU) {
                        pm.getPackageInfo(pkg, PackageManager.PackageInfoFlags.of(0))
                    } else {
                        pm.getPackageInfo(pkg, 0)
                    }
                    return true
                } catch (ignored: PackageManager.NameNotFoundException) {
                    // fine, package doesn't exist.
                }
            }
        }
        return false
    }

    companion object {
        /** the UTF-8 Charset  */
        private val UTF_8: Charset = Charset.forName("UTF-8")

        fun isDeviceRooted(context: Context): Boolean {
            return RootChecker(context).isDeviceRooted
        }
    }
}