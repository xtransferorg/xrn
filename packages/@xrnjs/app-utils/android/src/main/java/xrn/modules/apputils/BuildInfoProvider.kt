package xrn.modules.apputils

import android.os.Build
import com.blankj.utilcode.util.LogUtils

object BuildInfoProvider {

    /**
     * Returns the Build.VERSION.SDK_INT
     *
     * @return the Build.VERSION.SDK_INT
     */
    fun getSdkInfoVersion(): Int {
        return Build.VERSION.SDK_INT
    }

    fun getBuildTags(): String? {
        return Build.TAGS
    }

    fun getManufacturer(): String? {
        return Build.MANUFACTURER
    }

    fun getModel(): String? {
        return Build.MODEL
    }

    fun getVersionRelease(): String? {
        return Build.VERSION.RELEASE
    }

    /**
     * Check whether the application is running in an emulator.
     * https://github.com/flutter/plugins/blob/master/packages/device_info/android/src/main/java/io/flutter/plugins/deviceinfo/DeviceInfoPlugin.java#L105
     *
     * @return true if the application is running in an emulator, false otherwise
     */
    fun isEmulator(): Boolean {
        try {
            return ((Build.BRAND.startsWith("generic") && Build.DEVICE.startsWith("generic"))
                    || Build.FINGERPRINT.startsWith("generic")
                    || Build.FINGERPRINT.startsWith("unknown")
                    || Build.HARDWARE.contains("goldfish")
                    || Build.HARDWARE.contains("ranchu")
                    || Build.MODEL.contains("google_sdk")
                    || Build.MODEL.contains("Emulator")
                    || Build.MODEL.contains("Android SDK built for x86")
                    || Build.MANUFACTURER.contains("Genymotion")
                    || Build.PRODUCT.contains("sdk_google")
                    || Build.PRODUCT.contains("google_sdk")
                    || Build.PRODUCT.contains("sdk")
                    || Build.PRODUCT.contains("sdk_x86")
                    || Build.PRODUCT.contains("vbox86p")
                    || Build.PRODUCT.contains("emulator")
                    || Build.PRODUCT.contains("simulator"))
        } catch (e: Throwable) {
            LogUtils.e("Error checking whether application is running in an emulator.", e)
        }

        return false
    }


}