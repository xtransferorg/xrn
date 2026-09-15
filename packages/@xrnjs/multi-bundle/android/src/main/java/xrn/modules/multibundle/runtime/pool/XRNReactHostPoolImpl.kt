package xrn.modules.multibundle.runtime.pool

import android.os.Looper
import android.util.Log
import androidx.collection.LruCache
import com.facebook.react.ReactInstanceManager
import com.facebook.react.bridge.UiThreadUtil
import xrn.modules.multibundle.Utils
import xrn.modules.multibundle.bundle.split.RuntimeChecker
import xrn.modules.multibundle.runtime.JSBundleLoaderListener
import xrn.modules.multibundle.runtime.JSBundleType
import xrn.modules.multibundle.runtime.XRNJSBundleLoader
import xrn.modules.multibundle.runtime.XRNReactHostFactory
import xrn.modules.multibundle.runtime.XRNReactHostImpl
import xrn.modules.multibundle.runtime.getReactHostDelegate
import java.util.concurrent.atomic.AtomicBoolean

class XRNReactHostPoolImpl
@JvmOverloads constructor(
    override val enablePreCreate: Boolean,
    val coreMaxSize: Int,
    val reactHostFactory: XRNReactHostFactory,
    val jsBundleLoaderListener: JSBundleLoaderListener? = null,
    val commonOnlyMaxSize: Int = DEFAULT_COMMON_ONLY_MAX_SIZE,
    val instanceMemorySize: Int = DEFAULT_INSTANCE_MEMORY_SIZE,
) : XRNReactHostPool {

    companion object {
        const val DEFAULT_COMMON_ONLY_MAX_SIZE = 1
        const val DEFAULT_INSTANCE_MEMORY_SIZE = 10 * 1024 * 1024

        private const val COMMON_ONLY_BUNDLE_NAME = "COMMON_ONLY_BUNDLE"

        private fun prepareReactHost(reactHost: XRNReactHostImpl, bundleName: String) {
            val reactHostDelegate = reactHost.getReactHostDelegate()
            reactHostDelegate.bundleName = bundleName
            val jsBundleLoader = reactHostDelegate.jsBundleLoader
            if (jsBundleLoader is XRNJSBundleLoader) {
                jsBundleLoader.bundleName = bundleName
                jsBundleLoader.resumeLoadBizBundleIfNeeded()
            }
        }

        private fun prepareJSBundleLoader(
            reactHost: XRNReactHostImpl, listener: JSBundleLoaderListener
        ) {
            val reactHostDelegate = reactHost.getReactHostDelegate()
            val jsBundleLoader = reactHostDelegate.jsBundleLoader
            if (jsBundleLoader is XRNJSBundleLoader) {
                jsBundleLoader.setJSBundleLoaderListener(listener)
            }
        }
    }

    internal enum class EntryState {
        READY, DIRTY, ERROR
    }

    // TODO 软引用
    internal data class Entry(var reactHost: XRNReactHostImpl) {
        @Volatile
        var state: EntryState = EntryState.READY
        var updateTime: Long = System.currentTimeMillis()

        var attachedRootViewCount = 0

        fun moveState(state: EntryState) {
            this.state = state
            this.updateTime = System.currentTimeMillis()
        }

        fun onRootViewAttach() {
            attachedRootViewCount++
            moveState(EntryState.DIRTY)
        }

        fun onRootViewDetach() {
            if (attachedRootViewCount > 0) {
                attachedRootViewCount--
            }
        }

        fun isNoneAttachedRootView(): Boolean {
            return attachedRootViewCount <= 0
        }

        fun isPreLoadCommonInstance(): Boolean {
            return reactHost.bundleName == COMMON_ONLY_BUNDLE_NAME
        }
    }

    internal class CorePool(initialMaxSize: Int, val commonOnlyMaxSize: Int) {

        interface PreloadCallback {
            fun onPreloadStart()
            fun onPreloadEnd()
            fun onPreloadSkip()
            fun onPreloadError(error: Throwable?)
        }

        abstract class DefaultPreloadCallback : PreloadCallback {
            override fun onPreloadStart() {}
            override fun onPreloadEnd() {}
            override fun onPreloadSkip() {}
            override fun onPreloadError(error: Throwable?) {
                Log.e(Utils.TAG, "Preload error: ${error?.message}", error)
            }
        }

        private var maxSize = 0

        private val cacheLock = Any()
        private val instances = LruCache<String, Entry>(initialMaxSize + 1)

        init {
            this.maxSize = initialMaxSize
        }

        private val commonOnlyInstanceSize
            get() = synchronized(cacheLock) {
                instances.snapshot()
                    .filter { it.value.reactHost.bundleName == COMMON_ONLY_BUNDLE_NAME }.size
            }

        fun newInstance(bundleName: String, reactHostFactory: XRNReactHostFactory): Entry {
            val reactHost = reactHostFactory.createReactHost(bundleName, false)
            val entry = Entry(reactHost)
            put(bundleName, entry)
            return entry
        }

        fun preCreateInstance(
            bundleName: String,
            commonOnly: Boolean,
            reactHostFactory: XRNReactHostFactory,
            listener: JSBundleLoaderListener,
            callback: PreloadCallback? = null,
        ) {
            if (commonOnly && commonOnlyInstanceSize >= commonOnlyMaxSize) {
                Log.d(
                    Utils.TAG,
                    "[CorePool-preCreate] $bundleName skip create. commonOnlyInstances is full!"
                )
                callback?.onPreloadSkip()
                return
            }

            UiThreadUtil.runOnUiThread {
                // 创建/复用 + put 进池在 UI 线程上同步完成，并由 cacheLock 与 newInstance 互斥，
                // 避免 newInstance 在 IdleHandler 触发前抢先创建同 bundleName 的另一个 ReactHost。
                val reactHost: XRNReactHostImpl = synchronized(cacheLock) {
                    if (instances.get(bundleName) != null) {
                        Log.d(
                            Utils.TAG,
                            "[CorePool-preCreate] $bundleName already in pool, skip preCreate."
                        )
                        callback?.onPreloadSkip()
                        return@runOnUiThread
                    }

                    val commonCache = if (!commonOnly) popCommonCache() else null
                    val rh: XRNReactHostImpl = if (commonCache != null) {
                        commonCache.reactHost.also { prepareReactHost(it, bundleName) }
                    } else {
                        Log.d(
                            Utils.TAG, "[CorePool-preCreate] $bundleName common cache not hit."
                        )
                        reactHostFactory.createReactHost(bundleName, commonOnly)
                            .also { prepareJSBundleLoader(it, listener) }
                    }

                    put(bundleName, rh)
                    rh
                }

                // 真正的 bundle 加载（耗时）延迟到主线程空闲时执行。
                // 若在此之前 newInstance 已经命中并主动触发了 start()，这里会跳过加载。
                Looper.myQueue().addIdleHandler {
                    Log.d(Utils.TAG, "[CorePool-preCreate] $bundleName preCreate start...")
                    callback?.onPreloadStart()
                    if (reactHost.currentReactContext?.hasReactInstance() != true) {
                        Log.d(Utils.TAG, "[CorePool-preCreate] $bundleName start load bundle.")
                        reactHost.start()
                    }
                    callback?.onPreloadEnd()
                    Log.d(Utils.TAG, "[CorePool-preCreate] $bundleName preCreate end...")
                    false
                }
            }
        }

        private fun popCommonCache(): Entry? = synchronized(cacheLock) {
            val instance = instances.get(COMMON_ONLY_BUNDLE_NAME)
            if (instance == null) {
                Log.d(Utils.TAG, "[CorePool-popCommonCache] common cache not hit.")
                return null
            }
            instances.remove(COMMON_ONLY_BUNDLE_NAME)
            if (instance.state == EntryState.ERROR) {
                Log.d(Utils.TAG, "[CorePool-getOrCommonCache] common cache error.")
                return null
            }
            Log.d(Utils.TAG, "[CorePool-popCommonCache] common cache hit.")
            return instance
        }

        fun getOrCommonCache(bundleName: String): Entry? = synchronized(cacheLock) {
            // 优先取 bundleName 对应的实例，找不到才用预加载 common 实例
            var instance = instances.get(bundleName)

            if (instance == null || instance.state == EntryState.ERROR) {
                Log.d(Utils.TAG, "[CorePool-getOrCommonCache] $bundleName cache not hint.")
                instance = popCommonCache()
            } else {
                Log.d(Utils.TAG, "[CorePool-getOrCommonCache] $bundleName cache hint.")
            }

            return instance
        }

        fun put(bundleName: String, reactHost: XRNReactHostImpl) = put(bundleName, Entry(reactHost))

        fun put(bundleName: String, entry: Entry) = synchronized(cacheLock) {
            if (instances.size() >= maxSize) {
                maxSize = (maxSize * 1.5).toInt() + 1
                instances.trimToSize(maxSize)
            }

            instances.put(bundleName, entry)

            Log.d(Utils.TAG, "[CorePool-put] $bundleName put in pool.")
        }

        fun get(bundleName: String): Entry? = synchronized(cacheLock) {
            return instances.get(bundleName)
        }

        fun exists(bundleName: String): Boolean = synchronized(cacheLock) {
            return instances.get(bundleName) != null
        }

        fun all() = synchronized(cacheLock) {
            instances.snapshot().values
        }

        fun recycle() = synchronized(cacheLock) {
            Log.d(Utils.TAG, "Recycle instance start...")
            try {
                val iterator = instances.snapshot().entries.iterator()
                while (iterator.hasNext()) {
                    val next = iterator.next()
                    val entry = next.value
                    if (entry.isNoneAttachedRootView()) {
                        entry.reactHost.destroy("", null)
                        Log.d(Utils.TAG, "Recycle instance for bundle: ${next.key}")
                    }
                }
            } catch (e: Exception) {
                Log.e(Utils.TAG, "Recycle instance error: ${e.message}", e)
            }
            Log.d(Utils.TAG, "Recycle instance end...")
        }

    }

    internal data class PreloadParams(
        val bundleName: String,
        val commonOnly: Boolean,
    )

    private var isCreating = AtomicBoolean(false)

    private val corePool by lazy(LazyThreadSafetyMode.SYNCHRONIZED) {
        CorePool(coreMaxSize, commonOnlyMaxSize)
    }

    private val preloadParams by lazy(LazyThreadSafetyMode.SYNCHRONIZED) {
        mutableListOf<PreloadParams>()
    }

    private val mJsBundleLoaderListener by lazy {
        object : JSBundleLoaderListener {
            override fun onLoadStart(
                bundleName: String, commonOnly: Boolean, bundleType: JSBundleType
            ) {
                jsBundleLoaderListener?.onLoadStart(bundleName, commonOnly, bundleType)
            }

            override fun onLoadEnd(
                bundleName: String, commonOnly: Boolean, bundleType: JSBundleType
            ) {
                if (commonOnly && bundleType == JSBundleType.COMMON) {
                    isCreating.set(false)
                    invokeNextPreCreate()
                } else if (!commonOnly && bundleType == JSBundleType.BIZ) {
                    isCreating.set(false)
                    preCreate()
                }
                jsBundleLoaderListener?.onLoadEnd(bundleName, commonOnly, bundleType)
            }

            override fun onLoadFail(
                bundleName: String, commonOnly: Boolean, bundleType: JSBundleType, error: Throwable
            ) {
                corePool.get(bundleName)?.moveState(EntryState.ERROR)
                isCreating.set(false)
                invokeNextPreCreate()
                jsBundleLoaderListener?.onLoadFail(bundleName, commonOnly, bundleType, error)
            }
        }
    }

    override fun newInstance(bundleName: String): XRNReactHostImpl {
        recycleIfNeeded()

        var instance = corePool.getOrCommonCache(bundleName)
        if (instance != null) {
            if (instance.isPreLoadCommonInstance()) {
                prepareReactHost(instance.reactHost, bundleName)
                corePool.put(bundleName, instance)
            }
            Log.d(Utils.TAG, "[ReactHostPool] Create $bundleName instance with cache...")
            return instance.reactHost
        } else {
            Log.d(Utils.TAG, "[ReactHostPool] Create $bundleName instance without cache...")
            instance = corePool.newInstance(bundleName, reactHostFactory)
            prepareJSBundleLoader(instance.reactHost, mJsBundleLoaderListener)
            return instance.reactHost
        }
    }

    override fun all(): List<XRNReactHostImpl> {
        return corePool.all().map { it.reactHost }
    }

    override fun exist(bundleName: String): Boolean {
        return corePool.exists(bundleName)
    }

    override fun preCreate() {
        preCreate(COMMON_ONLY_BUNDLE_NAME, true)
    }

    override fun preCreate(bundleName: String) {
        preCreate(bundleName, false)
    }

    override fun preCreate(bundleName: String, commonOnly: Boolean) {
        preCreateInternal(bundleName, commonOnly)
        invokeNextPreCreate()
    }

    private fun preCreateInternal(bundleName: String, commonOnly: Boolean) {
        if (!enablePreCreate) {
            Log.d(Utils.TAG, "[PreCreate] PreCreate is disabled!")
            return
        }

        if (corePool.exists(bundleName)) {
            Log.d(Utils.TAG, "[PreCreate] $bundleName is already exists!")
            return
        }

        val instance = corePool.get(bundleName)
        if (instance != null) {
            val reactHost = instance.reactHost
            if (reactHost.currentReactContext?.hasReactInstance() == true) {
                Log.d(Utils.TAG, "[PreCreate] $bundleName is already loaded!")
            } else {
                Log.d(Utils.TAG, "[PreCreate] $bundleName is created. Start create context...")
                if (!isCreating.get()) {
                    reactHost.start()
                }
            }
            return
        }

        synchronized(preloadParams) {
            if (preloadParams.isNotEmpty() && preloadParams.any { it.bundleName == bundleName }) {
                Log.d(Utils.TAG, "[PreCreate] $bundleName is already in preload queue!")
                return
            }
        }

        if (recycleIfNeeded()) {
            if (RuntimeChecker.usedMem(0.6)) {
                Log.d(
                    Utils.TAG, "[PreCreate] Memory is insufficient, skip preCreate for $bundleName"
                )
                return
            }
        }

        synchronized(preloadParams) {
            preloadParams.add(PreloadParams(bundleName, commonOnly))
        }
    }


    fun invokeNextPreCreate() {
        if (isCreating.get()) return

        val nextParams = synchronized(preloadParams) {
            while (preloadParams.isNotEmpty()) {
                val next = preloadParams.removeAt(0)
                if (!corePool.exists(next.bundleName)) {
                    return@synchronized next
                }
            }

            null
        }

        if (nextParams != null) {
            doPreCreate(nextParams.bundleName, nextParams.commonOnly)
        }
    }

    private fun doPreCreate(bundleName: String, commonOnly: Boolean) {
        val callback = object : CorePool.DefaultPreloadCallback() {
            override fun onPreloadSkip() {
                invokeNextPreCreate()
            }
        }

        isCreating.set(true)
        corePool.preCreateInstance(
            bundleName, commonOnly, reactHostFactory, mJsBundleLoaderListener, callback
        )
    }

    override fun onRootViewAttach(bundleName: String) {
        Log.d(Utils.TAG, "RootViewAttach: bundleName: $bundleName")
        getInstanceInternal(bundleName)?.run {
            this.onRootViewAttach()
        }
    }

    override fun onRootViewDetach(bundleName: String) {
        Log.d(Utils.TAG, "RootViewDetach: bundleName: $bundleName")
        getInstanceInternal(bundleName)?.run {
            this.onRootViewDetach()
        }
    }

    override fun release(bundleName: String) {
        releaseInternal(bundleName, false)
    }

    override fun releaseForce(bundleName: String) {
        releaseInternal(bundleName, true)
    }

    private fun releaseInternal(bundleName: String, force: Boolean) {
        val instance = getInstanceInternal(bundleName) ?: return
        if (!force && !instance.isNoneAttachedRootView()) {
            return
        }

        UiThreadUtil.runOnUiThread {
            instance.reactHost.destroy("", null)
        }
    }

    override fun reload(bundleName: String) {
        reloadInternal(bundleName, false)
    }

    override fun reloadForce(bundleName: String) {
        reloadInternal(bundleName, true)
    }

    private fun reloadInternal(bundleName: String, force: Boolean) {
        val instance = getInstanceInternal(bundleName) ?: return
        if (!force && !instance.isNoneAttachedRootView()) {
            return
        }

        UiThreadUtil.runOnUiThread {
            instance.reactHost.reload("")
        }
    }

    private fun getInstanceInternal(bundleName: String): Entry? {
        return corePool.get(bundleName)
    }

    override fun recycle() {
        corePool.recycle()
    }

    private fun recycleIfNeeded(): Boolean {
        if (RuntimeChecker.usedMem(0.8) || RuntimeChecker.freeMemLessThan(instanceMemorySize)) {
            recycle()
            return true
        }

        return false
    }

}