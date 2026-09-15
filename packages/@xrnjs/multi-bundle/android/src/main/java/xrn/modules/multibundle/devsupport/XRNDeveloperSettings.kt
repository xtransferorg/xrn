package xrn.modules.multibundle.devsupport

import android.annotation.SuppressLint
import android.content.Context
import android.content.SharedPreferences
import com.facebook.react.modules.debug.interfaces.DeveloperSettings
import com.facebook.react.packagerconnection.PackagerConnectionSettings
import androidx.core.content.edit
import com.blankj.utilcode.util.Utils
import com.facebook.react.common.build.ReactBuildConfig

@SuppressLint("VisibleForTests")
open class XRNDeveloperSettings(
    val context: Context, val bundleName: String, val listener: Listener? = null
) : DeveloperSettings, SharedPreferences.OnSharedPreferenceChangeListener {

    interface Listener {
        fun onInternalSettingsChanged()
    }

    private var mPreferences: SharedPreferences = context.getSharedPreferences(
        bundleName, 0
    )

    private var mPackagerConnectionSettings = XRNPackageConnectionSettings(context, bundleName)

    init {
        this.mPreferences.registerOnSharedPreferenceChangeListener(this)
    }

    override fun onSharedPreferenceChanged(sharedPreferences: SharedPreferences?, key: String?) {
        if (listener == null) return

        if (PREFS_FPS_DEBUG_KEY == key || PREFS_JS_DEV_MODE_DEBUG_KEY == key || PREFS_START_SAMPLING_PROFILER_ON_INIT == key || PREFS_JS_MINIFY_DEBUG_KEY == key) {
            listener.onInternalSettingsChanged()
        }
    }

    override val packagerConnectionSettings: PackagerConnectionSettings
        get() = mPackagerConnectionSettings

    override var isFpsDebugEnabled: Boolean
        get() = this.mPreferences.getBoolean(PREFS_FPS_DEBUG_KEY, false)
        set(value) {
            this.mPreferences.edit {
                putBoolean(
                    PREFS_FPS_DEBUG_KEY, value
                )
            }
        }

    override var isAnimationFpsDebugEnabled: Boolean
        get() = this.mPreferences.getBoolean(PREFS_ANIMATIONS_DEBUG_KEY, false)
        set(value) {
            this.mPreferences.edit {
                putBoolean(
                    PREFS_ANIMATIONS_DEBUG_KEY, value
                )
            }
        }

    override var isJSDevModeEnabled: Boolean
        get() = this.mPreferences.getBoolean(PREFS_JS_DEV_MODE_DEBUG_KEY, true)
        set(value) {
            this.mPreferences.edit { putBoolean(PREFS_JS_DEV_MODE_DEBUG_KEY, value) }
        }

    override var isJSMinifyEnabled: Boolean
        get() = this.mPreferences.getBoolean(PREFS_JS_MINIFY_DEBUG_KEY, false)
        set(value) {
            this.mPreferences.edit { putBoolean(PREFS_JS_MINIFY_DEBUG_KEY, value) }
        }

    override var isElementInspectorEnabled: Boolean
        get() = this.mPreferences.getBoolean(PREFS_INSPECTOR_DEBUG_KEY, false)
        set(value) {
            this.mPreferences.edit { putBoolean(PREFS_INSPECTOR_DEBUG_KEY, value) }
        }

    override var isDeviceDebugEnabled: Boolean = ReactBuildConfig.DEBUG

    override var isRemoteJSDebugEnabled: Boolean
        get() = this.mPreferences.getBoolean(PREFS_REMOTE_JS_DEBUG_KEY, false)
        set(value) {
            this.mPreferences.edit { putBoolean(PREFS_REMOTE_JS_DEBUG_KEY, value) }
        }

    @Deprecated("Legacy sampling profiler is no longer supported - This field will be removed in React Native 0.77")
    override var isStartSamplingProfilerOnInit: Boolean
        get() = this.mPreferences.getBoolean(PREFS_START_SAMPLING_PROFILER_ON_INIT, false)
        set(value) {
            this.mPreferences.edit { putBoolean(PREFS_START_SAMPLING_PROFILER_ON_INIT, value) }
        }

    override var isHotModuleReplacementEnabled: Boolean
        get() = this.mPreferences.getBoolean(PREFS_HOT_MODULE_REPLACEMENT_KEY, true)
        set(value) {
            this.mPreferences.edit { putBoolean(PREFS_HOT_MODULE_REPLACEMENT_KEY, value) }
        }

    override fun addMenuItem(title: String) {
        // TODO 
    }

    fun isBundleDebugEnabled(): Boolean {
        return this.mPreferences.getBoolean(PREFS_BUNDLE_DEBUG_KEY, false)
    }

    open fun setBundleDebugEnabled(value: Boolean) {
        this.mPreferences.edit(commit = true) { putBoolean(PREFS_BUNDLE_DEBUG_KEY, value) }
    }

    open fun isSplitBundleDebugEnabled(defaultValue: Boolean = true): Boolean {
        return this.mPreferences.getBoolean(PREFS_SPLIT_BUNDLE_DEBUG_KEY, defaultValue)
    }

    open fun setSplitBundleDebugEnabled(value: Boolean) {
        this.mPreferences.edit(commit = true) { putBoolean(PREFS_SPLIT_BUNDLE_DEBUG_KEY, value) }
    }

    fun isCodePushEnabled(): Boolean {
        return this.mPreferences.getBoolean(PREFS_CODE_PUSH_DEBUG_KEY, true)
    }

    fun setCodePushEnabled(enabled: Boolean) {
        this.mPreferences.edit(commit = true) { putBoolean(PREFS_CODE_PUSH_DEBUG_KEY, enabled) }
    }

    fun getDebugServerPort(): Int {
        return this.mPreferences.getInt(PREFS_DEBUG_SERVER_PORT_KEY, DEBUG_SERVER_PORT_DEFAULT)
    }

    fun setDebugServerPort(port: Int) {
        this.mPreferences.edit(commit = true) { putInt(PREFS_DEBUG_SERVER_PORT_KEY, port) }
    }

    companion object {
        const val DEBUG_SERVER_PORT_DEFAULT = 0

        private const val PREFS_FPS_DEBUG_KEY = "fps_debug"
        private const val PREFS_JS_DEV_MODE_DEBUG_KEY = "js_dev_mode_debug"
        private const val PREFS_JS_MINIFY_DEBUG_KEY = "js_minify_debug"
        private const val PREFS_ANIMATIONS_DEBUG_KEY = "animations_debug"
        private const val PREFS_INSPECTOR_DEBUG_KEY = "inspector_debug"
        private const val PREFS_HOT_MODULE_REPLACEMENT_KEY = "hot_module_replacement"
        private const val PREFS_REMOTE_JS_DEBUG_KEY = "remote_js_debug"
        private const val PREFS_START_SAMPLING_PROFILER_ON_INIT = "start_sampling_profiler_on_init"

        private const val PREFS_BUNDLE_DEBUG_KEY = "js_bundle_debug"
        private const val PREFS_SPLIT_BUNDLE_DEBUG_KEY = "js_split_bundle_debug"
        private const val PREFS_CODE_PUSH_DEBUG_KEY = "js_code_push_debug"
        private const val PREFS_DEBUG_SERVER_PORT_KEY = "debug_server_port"

        private val INSTANCE_CACHE = HashMap<String, XRNDeveloperSettings>()

        @JvmStatic
        fun instance(bundleName: String): XRNDeveloperSettings? {
            if (!INSTANCE_CACHE.containsKey(bundleName)) {
                INSTANCE_CACHE[bundleName] = XRNDeveloperSettings(
                    Utils.getApp(), bundleName
                )
            }
            return INSTANCE_CACHE[bundleName]
        }
    }

}
