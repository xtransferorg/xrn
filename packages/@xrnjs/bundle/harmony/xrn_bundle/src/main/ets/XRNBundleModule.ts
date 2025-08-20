import { TurboModule } from '@rnoh/react-native-openharmony/ts';
import { TM } from "@rnoh/react-native-openharmony/generated/ts"
import { RN_INSTANCE_MANAGER} from 'xrn-multi-bundle/ts'
import { TurboModuleContext } from '@rnoh/react-native-openharmony/src/main/ets/RNOH/RNOHContext';
import { BundleInfoManager } from 'xrn-multi-bundle/src/main/ets/bundle/BundleInfoManager';
import { SettingsManager, CodePushUpdateManager, CodePushConstants } from 'xrn-code-push/ts'
import { bundleManager, common, Want } from '@kit.AbilityKit';

import { BundleInfo } from 'xrn-multi-bundle/src/main/ets/bundle/BundleInfo';

export class XRNBundleModule extends TurboModule implements TM.XRNBundleModule.Spec {

  bundleName: string;

  constructor(ctx: TurboModuleContext, bundleName: string) {
    super(ctx);
    this.bundleName = bundleName;
  }

  async getCurBundleInfo() {
    console.log(`${TM.XRNBundleModule.NAME}.getCurBundleInfo`)
    const bundleInfo = this.getBundleInfoLocal(this.bundleName);
    return bundleInfo
  }

  async getBundleInfo(bundleName: string) {
    console.log(`${TM.XRNBundleModule.NAME}.getBundleInfo:bundleName=${bundleName}`)
    const bundleInfo = this.getBundleInfoLocal(bundleName);
    return bundleInfo
  }

  async getAllBundleInfos() {
    console.log(`${TM.XRNBundleModule.NAME}.getAllBundleInfos`)
    const bundleInfos = BundleInfoManager.INSTANCE.BUNDLE_INFOS
    const bundleInfoArray = bundleInfos.map((value, index, array) => {
      return this.getBundleInfoLocal(value)
    })
    return {bundleInfoList: bundleInfoArray}
  }

  preLoadBundle(bundleName: string): void {
    console.log(`${TM.XRNBundleModule.NAME}.preLoadBundle:bundleName=${bundleName}`)
    RN_INSTANCE_MANAGER.preLoadBundle([bundleName])
  }

  async reloadBundle(): Promise<void> {
    console.log(`${TM.XRNBundleModule.NAME}.reloadBundle`)
    await RN_INSTANCE_MANAGER.reCreateRNInstance(this.bundleName);
    const rnInstanceWrapperList = RN_INSTANCE_MANAGER.getAllRNInstanceWrapper()
    for (let index = 0; index < rnInstanceWrapperList.length; index++) {
      const wrapper = rnInstanceWrapperList[index];
      if (wrapper.bundleName !== this.bundleName) {
        await RN_INSTANCE_MANAGER.reCreateRNInstance(wrapper.bundleName)
      }
    }
  }

  switchModule(bundleName: string, moduleName: string): void {
    console.log(`${TM.XRNBundleModule.NAME}.switchModule:bundleName=${bundleName}, moduleName=${moduleName}`)
    if (this.bundleName === bundleName) {
      //TODO
    } else {
      console.error(`${TM.XRNBundleModule.NAME}.switchModule:bundleName not match`)
    }
  }

  /**
   * 获取 Bundle Info 信息
   * @param bundle
   * @returns
   */
  private getBundleInfoLocal(bundle: string | BundleInfo): TM.XRNBundleModule.BundleInfo {
    let bundleInfo: BundleInfo | undefined = undefined
    if (bundle instanceof BundleInfo) {
      bundleInfo = bundle
    } else {
      bundleInfo = BundleInfoManager.INSTANCE.getBundleInfo(bundle)
    }
    const codePushInfo = this.getBundleCodePushInfoLocal(bundle)
    codePushInfo
    return {
      bundleName: bundleInfo?.bundleName,
      bundleType: bundleInfo?.bundleType,
      bundleJSFileName: bundleInfo?.getJSBundleName(),
      bundleLocalServerUrl: bundleInfo?.getLocalServerUrl(),
      bundleLocalServerPort: bundleInfo?.getLocalServerPort(),
      codePushPackage: codePushInfo
    }
  }

  /**
   * 获取 Bundle CodePush 相关信息
   * @param bundle
   * @returns
   */
  getBundleCodePushInfoLocal(bundle: string | BundleInfo): TM.XRNBundleModule.CodePushInfo {
    let bundleInfo: BundleInfo | undefined = undefined
    if (bundle instanceof BundleInfo) {
      bundleInfo = bundle
    } else {
      bundleInfo = BundleInfoManager.INSTANCE.getBundleInfo(bundle)
    }
    const settingManager = new SettingsManager(this.ctx.uiAbilityContext, bundleInfo?.getCodePushKey());
    const codePushUpdateManager = new CodePushUpdateManager(this.ctx.uiAbilityContext, this.ctx.uiAbilityContext.filesDir, bundleInfo?.getCodePushKey())
    const curPackage: object = codePushUpdateManager.getCurrentPackage();
    if (!curPackage) {
      return {}
    }
    let currentUpdateIsPending = false;
    if (CodePushConstants.PACKAGE_HASH_KEY in curPackage) {
      const currentHash = curPackage[CodePushConstants.PACKAGE_HASH_KEY]
      currentUpdateIsPending = settingManager.isPendingUpdate(currentHash)
    }
    if (currentUpdateIsPending) {
      return codePushUpdateManager?.getPreviousPackage() || {}
    } else {
      return curPackage
    }
  }

  async getBundleList() {
    return []
  }

}
