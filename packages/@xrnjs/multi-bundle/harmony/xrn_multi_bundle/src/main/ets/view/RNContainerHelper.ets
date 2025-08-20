import { ComponentBuilderContext, JSBundleProvider } from "@rnoh/react-native-openharmony"
import { RNInstanceConfig } from "@rnoh/react-native-openharmony/src/main/ets/RNApp"
import { RNContainerOptions } from "../../../../ets"
import { BundleInfoManager } from "../bundle/BundleInfoManager"
import { RN_INSTANCE_MANAGER } from "../bundle/RNInstanceManager"

export let globalRNContainerOptions: RNContainerOptions

/**
 * Initialize global RNContainer options.
 * @param options RNContainerOptions instance
 */
export function initRNContainerOptions(options: RNContainerOptions) {
  globalRNContainerOptions = options
}

/**
 * Get the RNInstanceConfig for a given bundle.
 * If the RNInstance already exists, return it directly;
 * otherwise, create a new RNInstanceConfig via global options.
 *
 * Note: Inside RNApp, if `rnInstance` is provided, it will be reused.
 * Otherwise, a new instance will be created.
 * The internal condition in RNApp is based on the existence of `rnInstance` field.
 *
 * @param bundleName The name of the bundle
 * @returns RNInstanceConfig
 */
export function getRNInstanceConfig(bundleName: string): RNInstanceConfig {
  let rnInstance = RN_INSTANCE_MANAGER.getRNInstanceByBundle(bundleName)
  if (rnInstance) {
    return { rnInstance }
  } else {
    const bundleInfo = BundleInfoManager.INSTANCE.getBundleInfo(bundleName)
    return globalRNContainerOptions.getRNInstanceOptions(bundleInfo!)
  }
}

/**
 * Get the wrapped custom RN component builder for the specified bundle.
 * @param bundleName The name of the bundle
 * @returns Wrapped component builder if found; otherwise, undefined
 */
export function getWrappedCustomRNComponentBuilder(bundleName: string): WrappedBuilder<[ComponentBuilderContext]> | undefined {
  const bundleInfo = BundleInfoManager.INSTANCE.getBundleInfo(bundleName)
  return globalRNContainerOptions.getWrappedCustomRNComponentBuilder(bundleInfo!)
}

/**
 * Get the JSBundleProvider for the specified bundle.
 * @param bundleName The name of the bundle
 * @returns JSBundleProvider instance or undefined
 */
export function getJSBundleProvider(bundleName: string): JSBundleProvider | undefined {
  return RN_INSTANCE_MANAGER.getJSBundleProviderByBundle(bundleName)
}