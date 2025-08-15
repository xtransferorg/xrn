export type BundleInfoListStatic = {
  bundleInfoList: BundleInfoStatic[];
}

export type BundleInfoStatic = {
  bundleName: string;
  bundleType: string;
  bundleJSFileName: string;
  bundleLocalServerUrl: string;
  bundleLocalServerPort: number;
  codePushPackage: CodePushInfoStatic;
}

export type CodePushInfoStatic = {
  appVersion?: string;
  binaryModifiedTime?: string;
  bundlePath?: string;
  deploymentKey?: string;
  description?: string;
  downloadUrl?: string;
  failedInstall?: boolean;
  isMandatory?: boolean;
  isPending?: boolean;
  label?: string;
  packageHash?: string;
  packageSize?: number;
}