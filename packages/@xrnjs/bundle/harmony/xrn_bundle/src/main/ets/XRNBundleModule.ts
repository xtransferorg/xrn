import { TurboModule } from '@rnoh/react-native-openharmony/ts';
import { TM } from "@rnoh/react-native-openharmony/generated/ts"
import { RN_INSTANCE_MANAGER} from '@xrnjs/multi-bundle/ts'
import { TurboModuleContext } from '@rnoh/react-native-openharmony/src/main/ets/RNOH/RNOHContext';
import { BundleInfoManager } from '@xrnjs/multi-bundle/src/main/ets/bundle/BundleInfoManager';
import { SettingsManager, CodePushUpdateManager, CodePushConstants } from '@xrnjs/react-native-code-push/ts'

import { BundleInfo } from '@xrnjs/multi-bundle/src/main/ets/bundle/BundleInfo';
import { PredownloadManager } from './PredownloadManager'

export class XRNBundleModule extends TurboModule implements TM.XRNBundleModule.Spec {

  bundleName: string;
  serverUrl: string;
  commonHash: string;

  constructor(ctx: TurboModuleContext, bundleName: string, serverUrl: string, commonHash: string) {
    super(ctx);
    this.bundleName = bundleName;
    this.serverUrl = serverUrl;
    this.commonHash = commonHash;
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

  preLoadBundle(bundleName: string): boolean {
    console.log(`${TM.XRNBundleModule.NAME}.preLoadBundle:bundleName=${bundleName}`)
    RN_INSTANCE_MANAGER.preloadFullJSBundle(bundleName)
    return true
  }

  reloadBundle(): boolean {
    this.reloadBundleLocal()
    return true
  }

  private async reloadBundleLocal() {
    await RN_INSTANCE_MANAGER.reCreateRNInstance(this.bundleName);
    const rnInstanceWrapperList = RN_INSTANCE_MANAGER.getAllRNInstanceWrapper()
    for (let index = 0; index < rnInstanceWrapperList.length; index++) {
      const wrapper = rnInstanceWrapperList[index];
      if (wrapper.bundleName !== this.bundleName) {
        await RN_INSTANCE_MANAGER.reCreateRNInstance(wrapper.bundleName)
      }
    }
    return true
  }

  switchModule(bundleName: string, moduleName: string): boolean {
    console.log(`${TM.XRNBundleModule.NAME}.switchModule:bundleName=${bundleName}, moduleName=${moduleName}`)
    if (this.bundleName === bundleName) {
      //TODO
    } else {
      console.error(`${TM.XRNBundleModule.NAME}.switchModule:bundleName not match`)
    }
    return true
  }

  async getBundleList(): Promise<TM.XRNBundleModule.BundleList[]> {
    const bundleInfoArray = BundleInfoManager.INSTANCE.BUNDLE_INFOS;
    const bundleListArray = [];
    bundleInfoArray.forEach((value, index, array) => {
      const bundleInfo =  {bundleName: value.bundleName, port: value.getLocalServerPort()}
      bundleListArray.push(bundleInfo)
    })
    return bundleListArray
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
      codePushPackage: codePushInfo,
      deliveryType: bundleInfo?.getDeliveryType(),
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
    const settingManager = new SettingsManager(this.ctx.uiAbilityContext, bundleInfo?.bundleName, bundleInfo?.getCodePushKey());
    const codePushUpdateManager = new CodePushUpdateManager(this.ctx.uiAbilityContext, this.ctx.uiAbilityContext.filesDir, bundleInfo?.bundleName, bundleInfo?.getCodePushKey())
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

  releaseBundle(bundleName: string): boolean {
    console.log(`${TM.XRNBundleModule.NAME}.releaseBundle:bundleName=${bundleName}`)
    RN_INSTANCE_MANAGER.releaseRNInstance(bundleName)
    return true
  }

  releaseBundleForce(bundleName: string): boolean {
    console.log(`${TM.XRNBundleModule.NAME}.releaseBundleForce:bundleName=${bundleName}`)
    RN_INSTANCE_MANAGER.releaseRNInstance(bundleName, true)
    return true
  }

  preloadCommonEnabled(enabled: boolean): boolean {
    // empty impl
    return true
  }

  preloadBundleEnabled(enabled: boolean): boolean {
    // empty impl
    return true
  }

  releaseAllBundle(options?: TM.XRNBundleModule.ReleaseAllBundleOptions): boolean {
    console.log(`${TM.XRNBundleModule.NAME}.releaseAllBundle`)
    const rnInstanceWrapperList = RN_INSTANCE_MANAGER.getAllRNInstanceWrapper()
    for (let index = 0; index < rnInstanceWrapperList.length; index++) {
      const rnInstanceWrapper = rnInstanceWrapperList[index];
      if (options?.excludeBundles && options.excludeBundles.includes(rnInstanceWrapper.bundleName)) {
        continue
      }
      RN_INSTANCE_MANAGER.releaseRNInstance(rnInstanceWrapper.bundleName)
    }
    return true
  }

  reloadBundleByName(bundleName: string): boolean {
    console.log(`${TM.XRNBundleModule.NAME}.reloadBundleByName`)
    const bundleStateWrapper = RN_INSTANCE_MANAGER.getBundleStateWrapper(bundleName)
    if (bundleStateWrapper && bundleStateWrapper.getRNViewCount() === 0) {
      RN_INSTANCE_MANAGER.reCreateRNInstance(bundleName)
    }
    return true
  }

  reloadBundleForceByName(bundleName: string): boolean {
    console.log(`${TM.XRNBundleModule.NAME}.reloadBundleForceByName`)
    RN_INSTANCE_MANAGER.reCreateRNInstance(bundleName)
    return true
  }

  preDownloadCodePush(bundleNames: string[]): Promise<boolean> {
    console.log(`${TM.XRNBundleModule.NAME}.preDownloadCodePush:bundleNames=${bundleNames}`)
    PredownloadManager.INSTANCE.batchPredownload(this.ctx.uiAbilityContext, this.serverUrl, this.commonHash, bundleNames)
    return Promise.resolve(true)
  }

  reportCodePushProgressShown(): Promise<void> {
    console.log(`${TM.XRNBundleModule.NAME}.reportCodePushProgressShown`)
    return Promise.resolve()
  }
}
