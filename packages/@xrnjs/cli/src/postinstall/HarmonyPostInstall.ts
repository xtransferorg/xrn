import { BundleConfigItem } from "../build/typing";
import { NativePostInstall } from "./NativePostInstall";
import { XrnConfig } from "./utils";
import path from "path";

/**
 * 鸿蒙平台 PostInstall
 */
export class HarmonyPostInstall extends NativePostInstall {
  constructor(cwd: string, xrnConfig: XrnConfig | null) {
    super(cwd, "鸿蒙", xrnConfig);
  }

  writeBundleConfig(bundles: BundleConfigItem[]): void {
    // 写入 bundle_config.json5 到鸿蒙
    this.writeBundleConfigJSON(
      path.join("harmony", "entry", "src", "main", "resources", "rawfile"),
      "bundle_config.json5",
      bundles
    );
  }

}

