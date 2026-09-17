import { ComponentBuilderContext, JSBundleProvider } from "@rnoh/react-native-openharmony"
import { RNInstanceConfig } from "@rnoh/react-native-openharmony/src/main/ets/RNApp"
import { RNContainerOptions } from "../../../../ets"
import { BundleInfoManager } from "../bundle/BundleInfoManager"
import { RN_INSTANCE_MANAGER } from "../bundle/RNInstanceManager"

export let globalRNContainerOptions: RNContainerOptions

export function initRNContainerOptions(options: RNContainerOptions) {
  globalRNContainerOptions = options
}

export function getRNInstanceConfig(bundleName: string): RNInstanceConfig {
  let rnInstance = RN_INSTANCE_MANAGER.getRNInstanceByBundle(bundleName)
  // RNApp 内部逻辑：如果传入了 RNInstance，则使用，不传就创建新的 RNInstance；
  // RNApp 内部判断条件是是否有 rnInstance 字段
  if (rnInstance) {
    return { rnInstance }
  } else {
    const bundleInfo = BundleInfoManager.INSTANCE.getBundleInfo(bundleName)
    return globalRNContainerOptions.getRNInstanceOptions(bundleInfo!)
  }
}

export function getWrappedCustomRNComponentBuilder(bundleName: string): WrappedBuilder<[ComponentBuilderContext]> | undefined {
  const bundleInfo = BundleInfoManager.INSTANCE.getBundleInfo(bundleName)
  return globalRNContainerOptions.getWrappedCustomRNComponentBuilder(bundleInfo!)
}

/**
 * 获取 JSBundleProvider
 * @param bundleName
 * @returns
 */
export function getJSBundleProvider(bundleName: string): JSBundleProvider | undefined {
  return RN_INSTANCE_MANAGER.getJSBundleProviderByBundle(bundleName)
}