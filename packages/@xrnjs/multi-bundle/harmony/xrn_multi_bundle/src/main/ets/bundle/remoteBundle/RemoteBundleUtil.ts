import { BundleInfo } from "../BundleInfo"
import { RemoteBundleInfo } from "./http/entity/RemoteBundleInfo"

export function convertRemoteBundle2BundleInfo(remoteBundle: RemoteBundleInfo): BundleInfo {
  if (!remoteBundle || !remoteBundle.bundleName) {
    return null
  }
  return new BundleInfo(remoteBundle.bundleName, remoteBundle.deliveryType === "DYNAMIC" ? BundleInfo.BUNDLE_TYPE_REMOTE : "", "", [], remoteBundle.deploymentKey, BundleInfo.DYNAMIC_UNKNOWN_PORT, remoteBundle.deliveryType)
}