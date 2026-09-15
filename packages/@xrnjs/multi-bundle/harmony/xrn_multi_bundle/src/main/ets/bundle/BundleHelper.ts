import { APP_BUNDLE_BUNDLE_INFO_MANAGER, APP_RN_RNINSTANCE_MANAGER } from '../Constants'
import { BundleInfoManager } from './BundleInfoManager'
import { RNInstanceManager, RN_INSTANCE_MANAGER } from './RNInstanceManager'
import { RNInstance } from '@rnoh/react-native-openharmony/src/main/ets/RNOH/RNInstance'
import { JSBundleProvider } from '@rnoh/react-native-openharmony/src/main/ets/RNOH/JSBundleProvider'

/**
 * 获取 RNInstance
 * @param bundleName
 * @returns
 */
export function getRNInstance(bundleName: string): RNInstance | undefined {
  return RN_INSTANCE_MANAGER.getRNInstanceByBundle(bundleName)
}

/**
 * 是否已注册 Bundle
 * @param bundleName
 * @returns
 */
export function isBundleRegistered(bundleName: string): boolean {
  const mgr = AppStorage.get<BundleInfoManager>(APP_BUNDLE_BUNDLE_INFO_MANAGER)
  return mgr?.isBundleRegistered(bundleName) == true
}


/**
 * 是否是拆包模式
 * @param bundleName 
 * @returns 
 */
export function isSplitMode(bundleName: string): boolean {
  const bundleInfo = BundleInfoManager.INSTANCE.getBundleInfo(bundleName)
  const splitBundleOptions = RN_INSTANCE_MANAGER.getOptions()?.getSplitBundleOptions()
  //默认为 true
  return splitBundleOptions?.isSplitMode?.(bundleInfo) ?? true
}
