package xrn.modules.navigation.reactnative.bean

data class NavigationInitialState(
    val type: String,
    val routes: List<NavigationInitialStateRoute>,
    val index: Number,
)

data class NavigationInitialStateRoute(
    val name: String,
    val params: Map<String, String>? = null,
    val state: NavigationInitialState? = null
)