package xrn.modules.navigation.kotlin.bean

data class NavigationRouteConfig(
    val path: String,
    val exported: Boolean,
    val bundleName: String,
    val moduleName: String,
    val pageName: String?
)