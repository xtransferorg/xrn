package xrn.modules.multibundle.runtime

interface XRNReactHostFactory {

    fun createReactHost(bundleName: String, commonOnly: Boolean): XRNReactHostImpl

}