import {BundleInfo} from '../../../BundleInfo'
export class RemoteBundleInfo {

  readonly bundleName: string
  readonly codePushName: string
  readonly deploymentKey: string
  readonly deliveryType: string

  constructor(bundleName: string, codePushName: string, deploymentKey: string, deliveryType: string) {
    this.bundleName = bundleName
    this.codePushName = codePushName
    this.deploymentKey = deploymentKey
    this.deliveryType = deliveryType
  }


  createBundleInfo(): BundleInfo {
    return new BundleInfo(this.bundleName, this.deliveryType === "DYNAMIC" ? BundleInfo.BUNDLE_TYPE_REMOTE : "", "", [], this.deploymentKey, BundleInfo.DYNAMIC_UNKNOWN_PORT, this.deliveryType)
  }
}