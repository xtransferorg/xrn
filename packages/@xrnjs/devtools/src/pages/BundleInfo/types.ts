export interface CodePushPackage {
  packageSize: number;
  binaryModifiedTime: string;
  isPending: boolean;
  isMandatory: boolean;
  label: string;
  failedInstall: boolean;
  downloadUrl: string;
  bundlePath: string;
  deploymentKey: string;
  packageHash: string;
  description: string;
  appVersion: string;
}

export interface BundleInfo {
  codePushPackage?: CodePushPackage;
  bundleName: string;
}

export interface BundleInfoList {
  bundleInfoList: BundleInfo[];
}
