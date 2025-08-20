import { APP_BUNDLE_BUNDLE_INFO_MANAGER, APP_RN_RNINSTANCE_MANAGER } from '../Constants'
import { BundleInfoManager } from './BundleInfoManager'
import { RNInstanceManager, RN_INSTANCE_MANAGER } from './RNInstanceManager'
import { RNInstance } from '@rnoh/react-native-openharmony/src/main/ets/RNOH/RNInstance'
import { JSBundleProvider } from '@rnoh/react-native-openharmony/src/main/ets/RNOH/JSBundleProvider'

/**
 * Obtain RN instance
 * @param bundleName The name of bundle
 * @returns RN instance
 */
export function getRNInstance(bundleName: string): RNInstance | undefined {
  return RN_INSTANCE_MANAGER.getRNInstanceByBundle(bundleName)
}

/**
 * Checks whether the specified bundle has been registered in the application.
 * @param bundleName The naame of the bundle to check.
 * @returns `true` if the bundle is registered; otherwise, `false`.
 */
export function isBundleRegistered(bundleName: string): boolean {
  const mgr = AppStorage.get<BundleInfoManager>(APP_BUNDLE_BUNDLE_INFO_MANAGER)
  return mgr?.isBundleRegistered(bundleName) == true
}
