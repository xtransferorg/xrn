package xrn.modules.navigation.reactnative

import com.blankj.utilcode.util.GsonUtils
import com.blankj.utilcode.util.ResourceUtils
import xrn.modules.navigation.kotlin.bean.NavigationRouteConfig


internal object NavigationRoutingTable {

    private const val ROUTING_TABLE_JSON_FILE_NAME = "routing-table.json"

    private val routingTable by lazy { mutableMapOf<String, NavigationRouteConfig>() }

    private val JSON_FILE_PATH by lazy { arrayOf("release_android", ROUTING_TABLE_JSON_FILE_NAME) }

    fun initialize() {
        loadTableFromAssets()
        loadTableFromCodePush()
    }

    private fun loadTableFromAssets() {
        val json = ResourceUtils.readAssets2String(ROUTING_TABLE_JSON_FILE_NAME)
        merge(json)
    }

    private fun loadTableFromCodePush() {
        // TODO 从 CodePush 中加载路由表
        /*RNHostManager.getAllRNHostWrapper().forEach {
            val packageFolder = it.mCodePush.packageFolder ?: return@forEach
            val jsonFilePath =
                listOf(packageFolder, *JSON_FILE_PATH).joinToString(separator = File.separator)

            if (!FileUtils.isFile(jsonFilePath)) return@forEach

            val json = FileIOUtils.readFile2String(jsonFilePath)

            merge(json)
        }*/
    }

    fun get(path: String?): NavigationRouteConfig? {
        if (path.isNullOrBlank()) return null

        // return routingTable[path]
        return FakeNavigationRoutingTable.get(path)
    }

    fun contains(path: String): Boolean {
        return routingTable.containsKey(path)
    }

    fun merge(routes: List<NavigationRouteConfig>) {
        routes.forEach { route ->
            merge(route)
        }
    }

    fun merge(routes: Array<NavigationRouteConfig>) {
        routes.forEach { route ->
            merge(route)
        }
    }

    fun merge(route: NavigationRouteConfig) {
        routingTable[route.path] = route
    }

    fun merge(json: String?) {
        if (json.isNullOrBlank()) return

        val routes =
            GsonUtils.fromJson(json, Array<NavigationRouteConfig>::class.java)

        merge(routes)
    }

}