package xrn.modules.multibundle.bundle

data class RemoteBundleInfo(
    val bundleName: String,
    val deploymentKey: String,
    val deliveryType: DeliveryType
)
