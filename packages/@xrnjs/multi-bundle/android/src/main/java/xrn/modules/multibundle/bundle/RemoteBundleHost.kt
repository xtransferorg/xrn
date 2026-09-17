package xrn.modules.multibundle.bundle

interface RemoteBundleHost {

    suspend fun getRemoteBundles(): List<RemoteBundleInfo>?

    suspend fun getRemoteBundle(bundleName: String): RemoteBundleInfo?

}