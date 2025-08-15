package xrn.modules.image.proxy

import android.graphics.drawable.Drawable
import com.bumptech.glide.Glide
import com.bumptech.glide.load.DataSource
import com.bumptech.glide.load.engine.DiskCacheStrategy
import com.bumptech.glide.load.engine.GlideException
import com.bumptech.glide.load.model.GlideUrl
import com.bumptech.glide.load.model.Headers
import com.bumptech.glide.load.model.LazyHeaders
import com.bumptech.glide.request.RequestListener
import com.bumptech.glide.request.target.Target
import com.facebook.react.bridge.Promise
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.MainScope
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import xrn.modules.image.ImageLoadTask
import xrn.modules.image.NoopDownsampleStrategy
import xrn.modules.image.customize
import xrn.modules.image.records.CachePolicy
import xrn.modules.image.records.ImageLoadOptions
import xrn.modules.image.records.SourceMap
import xrn.modules.kotlin.AppContext

interface ImageModule {

    fun prefetchInternal(
        urls: List<String>,
        cachePolicy: CachePolicy,
        headersMap: Map<String, String>?,
        promise: Promise
    )

    fun loadAsyncInternal(
        source: SourceMap,
        options: ImageLoadOptions?,
        promise: Promise
    )

    fun clearMemoryCacheInternal(promise: Promise)

    fun clearDiskCacheInternal(promise: Promise)

    fun getCachePathAsyncInternal(cacheKey: String, promise: Promise)

}

class ImageModuleImpl(val appContext: AppContext) : ImageModule {

    override fun prefetchInternal(
        urls: List<String>,
        cachePolicy: CachePolicy,
        headersMap: Map<String, String>?,
        promise: Promise
    ) {
        val context = appContext.reactContext ?: return

        var imagesLoaded = 0
        var failed = false

        val headers = headersMap?.let {
            LazyHeaders.Builder().apply {
                it.forEach { (key, value) ->
                    addHeader(key, value)
                }
            }.build()
        } ?: Headers.DEFAULT

        urls.forEach {
            Glide
                .with(context)
                .load(
                    GlideUrl(
                        it,
                        headers
                    )
                )
                //  Use `load` instead of `download` to store the asset in the memory cache
                // We added `quality` and `downsample` to create the same cache key as in final image load.
                .encodeQuality(100)
                .downsample(NoopDownsampleStrategy)
                .customize(`when` = cachePolicy == CachePolicy.MEMORY) {
                    diskCacheStrategy(DiskCacheStrategy.NONE)
                }
                .listener(object : RequestListener<Drawable> {
                    override fun onLoadFailed(
                        e: GlideException?,
                        model: Any?,
                        target: Target<Drawable>,
                        isFirstResource: Boolean
                    ): Boolean {
                        if (!failed) {
                            failed = true
                            promise.resolve(false)
                        }
                        return true
                    }

                    override fun onResourceReady(
                        resource: Drawable,
                        model: Any,
                        target: Target<Drawable>,
                        dataSource: DataSource,
                        isFirstResource: Boolean
                    ): Boolean {
                        imagesLoaded++

                        if (imagesLoaded == urls.size) {
                            promise.resolve(true)
                        }
                        return true
                    }
                })
                .submit()
        }
    }

    override fun loadAsyncInternal(
        source: SourceMap,
        options: ImageLoadOptions?,
        promise: Promise
    ) {
        MainScope().launch {
            withContext(Dispatchers.IO) {
                ImageLoadTask(appContext, source, options ?: ImageLoadOptions()).load(promise)
            }
        }
    }

    override fun clearMemoryCacheInternal(promise: Promise) {
        val activity = appContext.currentActivity

        if (activity == null) {
            promise.resolve(false)
            return
        }

        Glide.get(activity).clearMemory()

        promise.resolve(true)
    }

    override fun clearDiskCacheInternal(promise: Promise) {
        val activity = appContext.currentActivity

        if (activity == null) {
            promise.resolve(false)
            return
        }

        Glide.get(activity).clearDiskCache()

        promise.resolve(true)
    }

    override fun getCachePathAsyncInternal(cacheKey: String, promise: Promise) {
        val context = appContext.reactContext

        if (context == null) {
            promise.resolve(null)
            return
        }

        val glideUrl = GlideUrl(cacheKey)
        val target =
            Glide.with(context).asFile().load(glideUrl).onlyRetrieveFromCache(true).submit()

        var path: String? = null

        try {
            val file = target.get()
            path = file.absolutePath
        } catch (_: Exception) {
        }

        promise.resolve(path)
    }
}