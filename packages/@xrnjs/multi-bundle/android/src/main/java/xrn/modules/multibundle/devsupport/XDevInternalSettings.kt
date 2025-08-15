package xrn.modules.multibundle.devsupport

import android.annotation.SuppressLint
import android.content.Context
import android.content.SharedPreferences
import com.facebook.react.devsupport.DevInternalSettings
import com.facebook.react.packagerconnection.PackagerConnectionSettings
import xrn.modules.multibundle.Utils
import xrn.modules.multibundle.bundle.RNHostManager

/**
 * /**
 *  * Development internal settings for a specific React Native bundle.
 *  *
 *  * This class extends [DevInternalSettings] and implements
 *  * [SharedPreferences.OnSharedPreferenceChangeListener] to listen for
 *  * debug and development related preference changes.
 *  *
 *  * @param bundleName The name of the React Native bundle.
 *  * @param context The Android context.
 *  * @param listener Optional listener to notify when internal settings change.
 *  */
 */
@SuppressLint("VisibleForTests")
open class XDevInternalSettings(
    val bundleName: String,
    val context: Context,
    listener: Listener?,
) :
    DevInternalSettings(context, listener),
    SharedPreferences.OnSharedPreferenceChangeListener {

    private var mPreferences: SharedPreferences
    private var mListener: Listener?
    private var mPackagerConnectionSettings: PackagerConnectionSettings

    private var mIsBundleAssetFileExists = false

    init {
        this.mListener = listener
        this.mPreferences = context.getSharedPreferences(
            bundleName,
            0
        )

        this.mPreferences.registerOnSharedPreferenceChangeListener(this)
        this.mPackagerConnectionSettings =
            XPackageConnectionSettings(
                context,
                bundleName
            )

        val jsBundleFileName = "index.${bundleName}.bundle"
        this.mIsBundleAssetFileExists = Utils.isAssetsFileExist(context, "", jsBundleFileName)
    }

    /**
     * Returns the packager connection settings.
     */
    override fun getPackagerConnectionSettings(): PackagerConnectionSettings {
        return mPackagerConnectionSettings
    }

    /**
     * Returns whether FPS debugging is enabled.
     */
    override fun isFpsDebugEnabled(): Boolean {
        return this.mPreferences.getBoolean(PREFS_FPS_DEBUG_KEY, false)
    }

    /**
     * Enables or disables FPS debugging.
     */
    override fun setFpsDebugEnabled(enabled: Boolean) {
        this.mPreferences.edit().putBoolean(PREFS_FPS_DEBUG_KEY, enabled).apply()
    }

    /**
     * Returns whether animation FPS debugging is enabled.
     */
    override fun isAnimationFpsDebugEnabled(): Boolean {
        return this.mPreferences.getBoolean(PREFS_ANIMATIONS_DEBUG_KEY, false)
    }

    /**
     * Returns whether JS developer mode is enabled.
     */
    override fun isJSDevModeEnabled(): Boolean {
        return this.mPreferences.getBoolean(PREFS_JS_DEV_MODE_DEBUG_KEY, true)
    }

    /**
     * Enables or disables JS developer mode.
     */
    override fun setJSDevModeEnabled(value: Boolean) {
        this.mPreferences.edit().putBoolean(PREFS_JS_DEV_MODE_DEBUG_KEY, value).apply()
    }

    /**
     * Returns whether JS minify mode is enabled.
     */
    override fun isJSMinifyEnabled(): Boolean {
        return this.mPreferences.getBoolean(PREFS_JS_MINIFY_DEBUG_KEY, false)
    }

    /**
     * Called when a shared preference changes.
     * Notifies listener if relevant keys change.
     */
    override fun onSharedPreferenceChanged(sharedPreferences: SharedPreferences?, key: String?) {
        if (this.mListener != null && (PREFS_FPS_DEBUG_KEY == key || PREFS_JS_DEV_MODE_DEBUG_KEY == key || PREFS_START_SAMPLING_PROFILER_ON_INIT == key || PREFS_JS_MINIFY_DEBUG_KEY == key)) {
            this.mListener?.onInternalSettingsChanged()
        }
    }

    /**
     * Returns whether Hot Module Replacement (HMR) is enabled.
     */
    override fun isHotModuleReplacementEnabled(): Boolean {
        return this.mPreferences.getBoolean(PREFS_HOT_MODULE_REPLACEMENT_KEY, true)
    }

    /**
     * Enables or disables Hot Module Replacement (HMR).
     */
    override fun setHotModuleReplacementEnabled(enabled: Boolean) {
        this.mPreferences.edit().putBoolean(PREFS_HOT_MODULE_REPLACEMENT_KEY, enabled).apply()
    }

    /**
     * Returns whether the element inspector is enabled.
     */
    override fun isElementInspectorEnabled(): Boolean {
        return this.mPreferences.getBoolean(PREFS_INSPECTOR_DEBUG_KEY, false)
    }

    /**
     * Enables or disables the element inspector.
     */
    override fun setElementInspectorEnabled(enabled: Boolean) {
        this.mPreferences.edit().putBoolean(PREFS_INSPECTOR_DEBUG_KEY, enabled).apply()
    }

    /**
     * Returns whether device debug is enabled. Always returns false here.
     */
    override fun isDeviceDebugEnabled(): Boolean {
        return false
    }

    /**
     * Returns whether remote JS debugging is enabled.
     */
    override fun isRemoteJSDebugEnabled(): Boolean {
        return this.mPreferences.getBoolean(PREFS_REMOTE_JS_DEBUG_KEY, false)
    }

    /**
     * Enables or disables remote JS debugging.
     */
    override fun setRemoteJSDebugEnabled(remoteJSDebugEnabled: Boolean) {
        this.mPreferences.edit().putBoolean(PREFS_REMOTE_JS_DEBUG_KEY, remoteJSDebugEnabled).apply()
    }

    /**
     * Returns whether sampling profiler should start on init.
     */
    override fun isStartSamplingProfilerOnInit(): Boolean {
        return this.mPreferences.getBoolean(PREFS_START_SAMPLING_PROFILER_ON_INIT, false)
    }

    /**
     * Adds a menu item. No-op here.
     */
    override fun addMenuItem(title: String?) {}

    /**
     * Returns whether bundle debug is enabled.
     * Defaults to true if there is no built-in JS bundle.
     */
    fun isBundleDebugEnabled(): Boolean {
        // 如果存在内置 js bundle，默认不开启，否则默认开启
        return this.mPreferences.getBoolean(PREFS_BUNDLE_DEBUG_KEY, !mIsBundleAssetFileExists)
    }

    /**
     * Enables or disables bundle debug mode.
     */
    open fun setBundleDebugEnabled(value: Boolean) {
        this.mPreferences.edit().putBoolean(PREFS_BUNDLE_DEBUG_KEY, value).commit()
    }

    /**
     * Returns whether split bundle debug is enabled.
     *
     * @param defaultValue Default return value if not set.
     */
    open fun isSplitBundleDebugEnabled(defaultValue: Boolean = false): Boolean {
        return this.mPreferences.getBoolean(PREFS_SPLIT_BUNDLE_DEBUG_KEY, defaultValue)
    }

    /**
     * Enables or disables split bundle debug mode.
     */
    open fun setSplitBundleDebugEnabled(value: Boolean) {
        this.mPreferences.edit().putBoolean(PREFS_SPLIT_BUNDLE_DEBUG_KEY, value).commit()
    }

    companion object {

        private const val PREFS_FPS_DEBUG_KEY = "fps_debug"
        private const val PREFS_JS_DEV_MODE_DEBUG_KEY = "js_dev_mode_debug"
        private const val PREFS_BUNDLE_DEBUG_KEY = "js_bundle_debug"
        private const val PREFS_JS_MINIFY_DEBUG_KEY = "js_minify_debug"
        private const val PREFS_ANIMATIONS_DEBUG_KEY = "animations_debug"
        private const val PREFS_INSPECTOR_DEBUG_KEY = "inspector_debug"
        private const val PREFS_HOT_MODULE_REPLACEMENT_KEY = "hot_module_replacement"
        private const val PREFS_REMOTE_JS_DEBUG_KEY = "remote_js_debug"
        private const val PREFS_START_SAMPLING_PROFILER_ON_INIT = "start_sampling_profiler_on_init"

        private const val PREFS_SPLIT_BUNDLE_DEBUG_KEY = "js_split_bundle_debug"

        private val INSTANCE_CACHE = HashMap<String, XDevInternalSettings>()

        /**
         * Returns a cached or new instance of [XDevInternalSettings] for the given bundle name.
         *
         * Attempts to create the instance via RNHostManager's devSupportParams factory,
         * or falls back to creating a default instance.
         *
         * @param bundleName The name of the bundle.
         * @return The corresponding XDevInternalSettings instance.
         */
        @JvmStatic
        fun instance(bundleName: String): XDevInternalSettings? {
            if (!INSTANCE_CACHE.containsKey(bundleName)) {
                val xDevInternalSetting = RNHostManager.getParams()?.devSupportParams?.createDevInternalSettings?.invoke(bundleName, com.blankj.utilcode.util.Utils.getApp())
                INSTANCE_CACHE[bundleName] = xDevInternalSetting ?: XDevInternalSettings(bundleName, com.blankj.utilcode.util.Utils.getApp(), null)
            }
            return INSTANCE_CACHE[bundleName]
        }
    }

}
