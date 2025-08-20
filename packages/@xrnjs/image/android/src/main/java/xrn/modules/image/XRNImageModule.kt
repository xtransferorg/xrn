package xrn.modules.image

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import xrn.modules.image.proxy.ImageModule
import xrn.modules.image.proxy.ImageModuleImpl
import xrn.modules.image.records.CachePolicy
import xrn.modules.kotlin.AppContext
import xrn.modules.kotlin.fromValue
import xrn.modules.kotlin.modules.Module
import xrn.modules.kotlin.weak


class XRNImageModule(reactContext: ReactApplicationContext) :
    Module(reactContext),
    ImageModule by ImageModuleImpl(AppContext(reactContext.weak())) {

    override fun getName(): String {
        return NAME
    }

    override fun initialize() {
        super.initialize()
        reactApplicationContext.registerComponentCallbacks(ExpoImageComponentCallbacks)
    }

    override fun invalidate() {
        super.invalidate()
        reactApplicationContext.registerComponentCallbacks(ExpoImageComponentCallbacks)
    }

    @ReactMethod
    fun prefetch(
        urls: ReadableArray,
        cachePolicy: String?,
        headers: ReadableMap?,
        promise: Promise
    ) {
        val urlsList = urls.toArrayList().map { it as String }
        val headersMap = headers?.toHashMap() as Map<String, String>?
        val cachePolicyEnum = fromValue<CachePolicy>(cachePolicy, CachePolicy.DISK) { it.value }

        prefetchInternal(urlsList, cachePolicyEnum, headersMap, promise)
    }

    /*@ReactMethod
    fun loadAsync(
        source: ReadableArray,
        options: ReadableMap?,
        promise: Promise
    ) {

    }*/

    @ReactMethod
    fun clearMemoryCache(promise: Promise) {
        runOnUiQueueThread {
            clearMemoryCacheInternal(promise)
        }
    }

    @ReactMethod
    fun clearDiskCache(promise: Promise) {
        clearDiskCacheInternal(promise)
    }

    @ReactMethod
    fun getCachePathAsync(cacheKey: String, promise: Promise) {
        getCachePathAsyncInternal(cacheKey, promise)
    }

    companion object {
        private const val NAME = "XRNImageView"
    }

}