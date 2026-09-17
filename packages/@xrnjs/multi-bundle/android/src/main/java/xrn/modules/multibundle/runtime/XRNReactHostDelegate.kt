package xrn.modules.multibundle.runtime

import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.devsupport.DevSupportManagerFactory
import com.facebook.react.runtime.ReactHostDelegate


@OptIn(UnstableReactNativeAPI::class)
interface XRNReactHostDelegate : ReactHostDelegate, JSBundleFileHolder {

    var bundleName: String

    fun isSplitMode(): Boolean

    fun getUseDeveloperSupport(): Boolean

    fun getDevSupportManagerFactory(): DevSupportManagerFactory

}