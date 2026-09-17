import { BundleConfigItem } from "../build/typing";
import { NativePostInstall } from "./NativePostInstall";
import { XrnConfig } from "./utils";
import path from "path";

/**
 * Android 平台 PostInstall
 */
export class AndroidPostInstall extends NativePostInstall {
  constructor(cwd: string, xrnConfig: XrnConfig | null) {
    super(cwd, "Android", xrnConfig);
  }

  writeBundleConfig(bundles: BundleConfigItem[]): void {
    // 写入 bundle_config.json 到 Android
    this.writeBundleConfigJSON(
      path.join("android", "app", "src", "main", "res", "raw"),
      "bundle_config.json",
      bundles
    );
  }
}

