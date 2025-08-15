package xrn.modules.navigation.kotlin.exception

import android.app.Activity
import xrn.modules.navigation.kotlin.NavHelper.InitialProps
import xrn.modules.navigation.kotlin.NavHelper.ModuleInitialPayload
import xrn.modules.navigation.kotlin.Utils

data class NavigationBundle404Exception(
    override val target: ModuleInitialPayload,
    override val source: ModuleInitialPayload? = null,
) : NavigationException(
    "Bundle not found: bundleName = ${target.bundleName}, moduleName = ${target.moduleName}, pageName = ${target.initialProps?.initialRouteName}",
    target,
    source
) {
    companion object {

        fun build(
            activity: Activity,
            bundleName: String,
            moduleName: String? = null,
            initialProps: InitialProps? = null
        ): NavigationBundle404Exception {
            val state = Utils.getNavigationState(activity)
            val target = ModuleInitialPayload(
                bundleName = bundleName,
                moduleName = moduleName,
                initialProps = initialProps,
            )
            val source = if (state == null) {
                null
            } else {
                ModuleInitialPayload(
                    bundleName = state.bundleName,
                    moduleName = state.moduleName,
                )
            }

            return NavigationBundle404Exception(
                target = target,
                source = source
            )
        }

    }
}
