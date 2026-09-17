package xrn.modules.multibundle.runtime.pool

import com.facebook.react.ReactInstanceManager
import xrn.modules.multibundle.runtime.XRNReactHostImpl

interface XRNReactHostPool {

    val enablePreCreate: Boolean

    fun newInstance(bundleName: String): XRNReactHostImpl

    fun all(): List<XRNReactHostImpl>

    fun exist(bundleName: String): Boolean

    fun preCreate()

    fun preCreate(bundleName: String)

    fun preCreate(bundleName: String, commonOnly: Boolean)

    fun onRootViewAttach(bundleName: String)

    fun onRootViewDetach(bundleName: String)

    fun release(bundleName: String)

    fun releaseForce(bundleName: String)

    fun reload(bundleName: String)

    fun reloadForce(bundleName: String)

    fun recycle()

}