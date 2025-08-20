package xrn.modules.navigation.reactnative.bean

data class NavigationAction(
    val source: String,
    val type: NavigationActionType,
    val payload: NavigationActionPayload? = null,
    val target: String? = null
)

data class NavigationActionPayload(
    val name: String? = null,
    val params: Map<String, Any>? = null,
    val count: Int = 0
)

enum class NavigationActionType(type: String) {
    NAVIGATE("NAVIGATE"),
    REPLACE("REPLACE"),
    PUSH("PUSH"),
    GO_BACK("GO_BACK")
}