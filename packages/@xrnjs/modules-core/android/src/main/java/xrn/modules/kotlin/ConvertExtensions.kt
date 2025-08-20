package xrn.modules.kotlin

import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap

inline fun <reified T : Enum<T>> fromValue(
    value: String?, default: T, selector: (T) -> String
): T {
    return enumValues<T>().find { selector(it) == value } ?: default
}

inline fun <reified T> ReadableMap.safeGet(key: String, default: T? = null): T? {
    return if (hasKey(key)) {
        when (T::class) {
            Int::class -> getInt(key) as T
            Double::class -> getDouble(key) as T
            String::class -> getString(key) as T
            Boolean::class -> getBoolean(key) as T
            WritableMap::class -> getMap(key) as T
            WritableArray::class -> getArray(key) as T
            else -> throw IllegalArgumentException("Unsupported type")
        }
    } else {
        default
    }
}

fun ReadableMap.safeGetAny(key: String): Any? {
    return if (hasKey(key)) {
        val realType = getType(key)
        when (realType) {
            ReadableType.Boolean -> getBoolean(key)
            ReadableType.Number -> getDouble(key)
            ReadableType.String -> getString(key)
            else -> throw IllegalArgumentException("Unsupported type")
        }
    } else {
        null
    }
}

fun ReadableMap.safeGetMap(key: String): HashMap<String, Any>? {
    return if (hasKey(key)) {
        getMap(key)?.toHashMap()
    } else {
        null
    }
}

inline fun <reified T> WritableArray.addIf(condition: Boolean, valueToAdd: T) {
    if (condition) {
        when (T::class) {
            Int::class -> pushInt(valueToAdd as Int)
            Double::class -> pushDouble(valueToAdd as Double)
            String::class -> pushString(valueToAdd as String)
            Boolean::class -> pushBoolean(valueToAdd as Boolean)
            WritableMap::class -> pushMap(valueToAdd as WritableMap)
            WritableArray::class -> pushArray(valueToAdd as WritableArray)
            else -> throw IllegalArgumentException("Unsupported type")
        }
    }
}