package xrn.modules.bundle

import com.facebook.react.bridge.ReadableMap


data class ReleaseAllBundlesOptions(
    val excludeBundles: List<String>?
) {
    companion object {
        fun from(readableMap: ReadableMap?): ReleaseAllBundlesOptions {
            val excludeBundles = mutableListOf<String>()

            val origin = readableMap?.getArray("excludeBundles")
            if (origin != null) {
                for (idx in 0 until origin.size()) {
                    excludeBundles.add(origin.getString(idx)!!)
                }
            }

            return ReleaseAllBundlesOptions(excludeBundles)
        }
    }
}