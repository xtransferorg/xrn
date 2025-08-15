import { AbilityStage } from "@kit.AbilityKit";
import {
  APP_RNOH_RNOHCoreContext,
  BundleInfo, BundleInfoManager, initRNContainerOptions, RNInstanceManager } from "xrn-multi-bundle";
import { getRNContainerOptions, getRNInstanceOptions } from "./BundleHelper";
import {
  AnyJSBundleProvider,
  JSBundleProvider, MetroJSBundleProvider,
  ResourceJSBundleProvider,
  RNOHCoreContext,
  TraceJSBundleProviderDecorator} from "@rnoh/react-native-openharmony";
import { CodePushJSBundleProvider } from "xrn-code-push";

export default class MainAbilityStage extends AbilityStage {

  constructor() {
    super()
  }

  onCreate(): void {
    initRNContainerOptions(getRNContainerOptions())
    BundleInfoManager.initWithRawFile(this.context, "bundle_config.json5", undefined)
    RNInstanceManager.init({
      getRNInstanceOptions: getRNInstanceOptions,
      createJSBundleProvider: createJSBundleProvider,
    })

  }

  onDestroy(): void {
  }

}

/**
 * 创建 JSBundleProvider
 * @param bundleInfo
 * @returns
 */
function createJSBundleProvider(bundleInfo: BundleInfo): JSBundleProvider | undefined {
  const rnohCoreContext: RNOHCoreContext | undefined = AppStorage.get<RNOHCoreContext>(APP_RNOH_RNOHCoreContext)
  const jsBundleProviderArray: Array<JSBundleProvider> = new Array()
  //本地服务，TODO：Dev 环境
  jsBundleProviderArray.push(new MetroJSBundleProvider(bundleInfo.getLocalServerUrl(), bundleInfo.getModuleNames()))
  // //热更新
  jsBundleProviderArray.push(CodePushJSBundleProvider.loadCodePushBundle(rnohCoreContext?.uiAbilityContext, bundleInfo.getJSBundleName(), bundleInfo.getCodePushKey()))
  // NOTE: to load the bundle from file, place it in
  // `/data/app/el2/100/base/com.rnoh.tester/files/bundle.harmony.js`
  // on your device. The path mismatch is due to app sandboxing on HarmonyOS
  // jsBundleProviderArray.push(new FileJSBundleProvider('/data/storage/el2/base/files/bundle.harmony.js'))
  //内置 hbc
  // jsBundleProviderArray.push(new ResourceJSBundleProvider(rnohCoreContext?.uiAbilityContext.resourceManager!, 'hermes_bundle.hbc'))
  // //内置 js
  jsBundleProviderArray.push(new ResourceJSBundleProvider(rnohCoreContext?.uiAbilityContext.resourceManager!, bundleInfo?.getJSBundleName(), bundleInfo.getModuleNames()))
  const anyJSBundleProvider = new AnyJSBundleProvider(jsBundleProviderArray)
  const newProvider = new TraceJSBundleProviderDecorator(anyJSBundleProvider, rnohCoreContext?.logger!)
  const config = newProvider.getHotReloadConfig()
  console.log(config?.host)
  return newProvider
}
