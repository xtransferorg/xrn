export class GetBundleInfoRequest {
  bundleName: string;
  env: string;
  buildType: string;
  platform: string = "harmony";
}