import { WrappedCustomRNComponentBuilder } from "@rnoh/react-native-openharmony/src/main/ets/RNOH";
import { JSBundleProvider } from "@rnoh/react-native-openharmony/src/main/ets/RNOH/JSBundleProvider";
import { RNInstance, RNInstanceOptions } from "@rnoh/react-native-openharmony/src/main/ets/RNOH/RNInstance";
import { BundleInfo } from "../bundle/BundleInfo";

/**
 * RNContainer 依赖数据
 */
export interface RNContainerOptions {

  /**
   * 创建 RNInstance 依赖数据
   * @param bundleInfo
   * @returns
   */
  getRNInstanceOptions: (bundleInfo: BundleInfo) => RNInstanceOptions;


  /**
   * 获取 自定义组件 Builder
   * @param bundleInfo
   * @returns
   */
  getWrappedCustomRNComponentBuilder : (bundleInfo: BundleInfo) => (WrappedCustomRNComponentBuilder | undefined)

  /**
   * RNApp 在 RNInstance 就绪后的回调(runJSBundle 之前)
   * @param rnInstance
   * @param bundleName
   * @returns
   */
  onSetup: (rnInstance: RNInstance, bundleName: string) => Promise<void>
}