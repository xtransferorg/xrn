package xrn.modules.image

import com.facebook.react.bridge.ReadableArray
import xrn.modules.image.records.SourceMap
import xrn.modules.kotlin.safeGet
import xrn.modules.kotlin.safeGetMap

@Suppress("UNCHECKED_CAST")
fun toImageSources(sources: ReadableArray?): List<SourceMap> {
    if (sources == null || sources.size() == 0) {
        return emptyList()
    } else {
        val tmpSources = mutableListOf<SourceMap>()

        for (idx in 0 until sources.size()) {
            val source = sources.getMap(idx)
            val imageSource = SourceMap(
                uri = source.getString("uri"),
                width = source.safeGet<Int>("width") ?: 0,
                height = source.safeGet<Int>("height") ?: 0,
                scale = source.safeGet<Double>("scale") ?: 1.0,
                headers = source.safeGetMap("headers") as Map<String, String>?,
                cacheKey = source.safeGet<String>("cacheKey"),
            )
            tmpSources.add(imageSource)
        }

        return tmpSources
    }
}