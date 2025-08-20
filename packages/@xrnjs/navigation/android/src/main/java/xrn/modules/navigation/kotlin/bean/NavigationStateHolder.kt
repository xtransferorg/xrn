package xrn.modules.navigation.kotlin.bean

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap

data class NavigationStateHolder(
    val bundleName: String,
    val moduleName: String,
    var rnRootKey: String? = null,
    var rnRootState: String? = null
) {
    fun toReadableMap(): WritableMap {
        return Arguments.createMap().apply {
            putString("rootKey", rnRootKey)
            putString("bundleName", bundleName)
            putString("moduleName", moduleName)
        }
    }
}
