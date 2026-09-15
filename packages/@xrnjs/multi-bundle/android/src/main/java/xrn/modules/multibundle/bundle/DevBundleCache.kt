package xrn.modules.multibundle.bundle

import com.blankj.utilcode.util.GsonUtils
import com.blankj.utilcode.util.SPUtils

object DevBundleCache {
    private const val DEV_BUNDLES_KEY = "dev_bundles"

    private val cache by lazy { SPUtils.getInstance() }

    fun addDevBundle(bundleInfo: BundleInfo) {
        val oldBundles = getDevBundles().toMutableList()
        val index = oldBundles.indexOfFirst { it.bundleName == bundleInfo.bundleName }
        if (index != -1) {
            oldBundles.removeAt(index)
        }
        oldBundles.add(bundleInfo)
        cache.put(DEV_BUNDLES_KEY, GsonUtils.toJson(oldBundles))
    }

    fun getDevBundles(): List<BundleInfo> {
        try {
            val jsonStr = cache.getString(DEV_BUNDLES_KEY, "[]")
            return GsonUtils.fromJson(
                jsonStr,
                GsonUtils.getListType(BundleInfo::class.java)
            )
        } catch (e: RuntimeException) {

        }

        return emptyList()
    }

}