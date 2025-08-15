package xrn.modules.navigation.reactnative

import xrn.modules.navigation.kotlin.bean.NavigationRouteConfig

object FakeNavigationRoutingTable {

    fun get(path: String?): NavigationRouteConfig? {
        if (path.isNullOrBlank()) return null

        val pathSplit = path.split("/")

        val bundleName = pathSplit.getOrNull(1)
        val moduleName = pathSplit.getOrNull(2)
        val pageName = pathSplit.getOrNull(3)

        if (bundleName.isNullOrBlank() || moduleName.isNullOrBlank()) {
            return null
        }

        return NavigationRouteConfig(
            path = path,
            exported = true,
            bundleName = bundleName,
            moduleName = moduleName,
            pageName = pageName
        )
    }

}