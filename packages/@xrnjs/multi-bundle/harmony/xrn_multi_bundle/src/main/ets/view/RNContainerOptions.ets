import { WrappedCustomRNComponentBuilder } from "@rnoh/react-native-openharmony/src/main/ets/RNOH";
import { JSBundleProvider } from "@rnoh/react-native-openharmony/src/main/ets/RNOH/JSBundleProvider";
import { RNInstance, RNInstanceOptions } from "@rnoh/react-native-openharmony/src/main/ets/RNOH/RNInstance";
import { BundleInfo } from "../bundle/BundleInfo";

/**
 * Configuration options and dependencies required by RNContainer.
 */
export interface RNContainerOptions {

  /**
   * Create the RNInstanceOptions for a given bundle.
   * @param bundleInfo Metadata describing the bundle
   * @returns RNInstanceOptions instance
   */
  getRNInstanceOptions: (bundleInfo: BundleInfo) => RNInstanceOptions;


  /**
   * Get the wrapped custom component builder for the given bundle.
   * Used to override or extend default RN components.
   * @param bundleInfo Metadata describing the bundle
   * @returns WrappedCustomRNComponentBuilder instance, or undefined if not provided
   */
  getWrappedCustomRNComponentBuilder : (bundleInfo: BundleInfo) => (WrappedCustomRNComponentBuilder | undefined)

  /**
   * Callback invoked by RNApp after RNInstance is created but before runJSBundle is called.
   * This can be used for additional setup or preloading logic.
   * @param rnInstance The created RNInstance
   * @param bundleName Name of the bundle
   * @returns A Promise that resolves when setup is complete
   */
  onSetup: (rnInstance: RNInstance, bundleName: string) => Promise<void>
}