package xrn.modules.navigation.reactnative

import android.app.Activity
import com.blankj.utilcode.util.LogUtils
import xrn.modules.navigation.kotlin.NavHelper


internal object NavigationRestorer {

    fun initialize() {
        Thread.setDefaultUncaughtExceptionHandler(ThreadUncaughtExceptionHandler {
            NavigationModule.beforeAppCrash()
        })
    }

    fun tryRestoringRoutes(activity: Activity): Boolean {
        if (!NavigationState.isAppCrashed()) {
            return false
        }

        NavigationState.startRestoring()

        val result = restoringRoutes(activity)

        NavigationState.endRestoring()

        return result
    }

    private fun restoringRoutes(activity: Activity): Boolean {
        val cachedStates = NavigationState.getAllNavigationInitialStateFromCache()

        val availableStates = cachedStates
        // val availableStates = cachedStates.filter { it != null && !it.state.isNullOrBlank() }

        if (availableStates.isEmpty() || availableStates.size != cachedStates.size) return false

        val intents = availableStates
            .mapNotNull {
                it!!

                NavHelper.buildIntent(
                    activity,
                    it.bundleName,
                    it.moduleName,
                    NavHelper.InitialProps(initialState = it.rnRootState)
                )
            }

        if (intents.isEmpty() || intents.size != cachedStates.size) return false

        LogUtils.e(availableStates)
        LogUtils.e(intents)

        activity.startActivities(intents.toTypedArray())

        return true
    }

}
