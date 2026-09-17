import {
  isNativeModuleMethodAvailable,
  requireNativeModule
} from '@xrnjs/modules-core';

import { NativeXRNBundleModuleSpec } from '.';
import {
  BundleInfo,
  BundleInfoList,
  BundleList,
  ReleaseAllBundleOptions,
  Spec
} from './spec/NativeXRNBundleModule';

const ModuleName = 'XRNBundleModule';

export const NativeXRNBundle =
  requireNativeModule<NativeXRNBundleModuleSpec>(ModuleName);

export const XRNBundle: Spec = {
  getCurBundleInfo(): Promise<BundleInfo> {
    return NativeXRNBundle.getCurBundleInfo();
  },
  getBundleInfo(bundleName: string): Promise<BundleInfo> {
    return NativeXRNBundle.getBundleInfo(bundleName);
  },
  getAllBundleInfos(): Promise<BundleInfoList> {
    return NativeXRNBundle.getAllBundleInfos();
  },
  getBundleList(): Promise<BundleList[]> {
    return NativeXRNBundle.getBundleList();
  },
  preLoadBundle(bundleName: string): boolean {
    if (!isNativeModuleMethodAvailable(ModuleName, 'preLoadBundle')) {
      console.warn(
        `[XRNBundle] Native module method 'preLoadBundle' is not available on ${ModuleName}.`
      );
      return false;
    }

    return NativeXRNBundle.preLoadBundle(bundleName);
  },
  releaseBundle(bundleName: string): boolean {
    if (!isNativeModuleMethodAvailable(ModuleName, 'releaseBundle')) {
      console.warn(
        `[XRNBundle] Native module method 'releaseBundle' is not available on ${ModuleName}.`
      );
      return false;
    }

    return NativeXRNBundle.releaseBundle(bundleName);
  },
  releaseBundleForce(bundleName: string): boolean {
    if (!isNativeModuleMethodAvailable(ModuleName, 'releaseBundleForce')) {
      console.warn(
        `[XRNBundle] Native module method 'releaseBundleForce' is not available on ${ModuleName}.`
      );
      return false;
    }

    return NativeXRNBundle.releaseBundleForce(bundleName);
  },
  releaseAllBundle(options?: ReleaseAllBundleOptions): boolean {
    if (!isNativeModuleMethodAvailable(ModuleName, 'releaseAllBundle')) {
      console.warn(
        `[XRNBundle] Native module method 'releaseAllBundle' is not available on ${ModuleName}.`
      );
      return false;
    }

    return NativeXRNBundle.releaseAllBundle(options);
  },
  reloadBundleByName(bundleName: string): boolean {
    if (!isNativeModuleMethodAvailable(ModuleName, 'reloadBundleByName')) {
      console.warn(
        `[XRNBundle] Native module method 'reloadBundleByName' is not available on ${ModuleName}.`
      );
      return false;
    }

    return NativeXRNBundle.reloadBundleByName(bundleName);
  },
  reloadBundleForceByName(bundleName: string): boolean {
    if (!isNativeModuleMethodAvailable(ModuleName, 'reloadBundleForceByName')) {
      console.warn(
        `[XRNBundle] Native module method 'reloadBundleForceByName' is not available on ${ModuleName}.`
      );
      return false;
    }

    return NativeXRNBundle.reloadBundleForceByName(bundleName);
  },
  preloadCommonEnabled(enabled: boolean): boolean {
    return NativeXRNBundle.preloadCommonEnabled(enabled);
  },
  preloadBundleEnabled(enabled: boolean): boolean {
    return NativeXRNBundle.preloadBundleEnabled(enabled);
  },
  reloadBundle(): boolean {
    return NativeXRNBundle.reloadBundle();
  },
  switchModule(bundleName: string, moduleName: string): boolean {
    return NativeXRNBundle.switchModule(bundleName, moduleName);
  },
  preDownloadCodePush(bundleNames: string[]): Promise<boolean> {
    if (!isNativeModuleMethodAvailable(ModuleName, 'preDownloadCodePush')) {
      console.warn(
        `[XRNBundle] Native module method 'preDownloadCodePush' is not available on ${ModuleName}.`
      );
      return Promise.resolve(false);
    }

    return NativeXRNBundle.preDownloadCodePush(bundleNames);
  },
  reportCodePushProgressShown(): Promise<void> {
    if (
      !isNativeModuleMethodAvailable(ModuleName, 'reportCodePushProgressShown')
    ) {
      console.warn(
        `[XRNBundle] Native module method 'reportCodePushProgressShown' is not available on ${ModuleName}.`
      );
      return Promise.resolve();
    }

    return NativeXRNBundle.reportCodePushProgressShown();
  }
};
