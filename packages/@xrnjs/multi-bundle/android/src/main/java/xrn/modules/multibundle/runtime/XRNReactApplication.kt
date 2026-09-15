package xrn.modules.multibundle.runtime

import com.facebook.react.ReactApplication
import xrn.modules.multibundle.runtime.pool.XRNReactHostPool

interface XRNReactApplication : ReactApplication {

    val reactHostPool: XRNReactHostPool

}