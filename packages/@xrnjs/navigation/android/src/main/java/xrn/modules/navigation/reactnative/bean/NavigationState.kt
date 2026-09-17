package xrn.modules.navigation.reactnative.bean

data class NavigationState(
    val type: String,
    val routes: List<NavigationRoute>,
    val index: Number,
)

data class NavigationRoute(
    val name: String,
    val params: Map<String, String>? = null,
    val state: NavigationState? = null
)