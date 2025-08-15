package xrn.modules.navigation.reactnative

import com.blankj.utilcode.util.ActivityUtils
import com.blankj.utilcode.util.GsonUtils
import com.blankj.utilcode.util.SPUtils
import xrn.modules.navigation.kotlin.NavigationStateHolderProvider
import xrn.modules.navigation.kotlin.bean.NavigationStateHolder

internal object NavigationState {

    private val NAVIGATION_SP by lazy { SPUtils.getInstance("XTNavigation") }

    private const val KEY_APP_LAST_CRASH_AT = "AppLastCrashAt"
    private const val KEY_APP_STACK_STATE = "AppStackState"

    private var isRestoring = false

    private fun markAppCrash() {
        NAVIGATION_SP.put(KEY_APP_LAST_CRASH_AT, System.currentTimeMillis(), true)
        NAVIGATION_SP.put(KEY_APP_STACK_STATE, getAllNavigationState().toSet(), true)
    }

    fun endRestoring() {
        isRestoring = false
        NAVIGATION_SP.clear(true)
    }

    fun isAppCrashed(): Boolean {
        return NAVIGATION_SP.getLong(KEY_APP_LAST_CRASH_AT, 0L) > 0L
    }

    fun startRestoring() {
        isRestoring = true
    }

    fun beforeAppCrash() {
        if (isRestoring) {
            endRestoring()
            return
        }

        markAppCrash()
    }

    fun getAllNavigationInitialStateFromCache(): List<NavigationStateHolder?> {
        return NAVIGATION_SP.getStringSet(KEY_APP_STACK_STATE, emptySet())
            .map {
                GsonUtils.fromJson(it, NavigationStateHolder::class.java)
            }
    }

    private fun getAllNavigationState(): List<String> {
        return ActivityUtils.getActivityList().filterIsInstance<NavigationStateHolderProvider>()
            .map {
                GsonUtils.toJson(it.getNavigationStateHolder(), NavigationStateHolder::class.java)
            }
    }

}