import fs from "fs-extra";
import path from "path";
import { BasePostInstall } from "./BasePostInstall";
import { execInherit } from "../build/utils/shell";
import logger from "../utlis/logger";

const DEPENDENCY_SECTIONS = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
  "resolutions",
];

/**
 * Bundle 平台 PostInstall
 */
export class BundlePostInstall extends BasePostInstall {
  constructor(cwd: string) {
    super(cwd, "Bundle");
  }

  protected async runPlatformSpecificTasks(): Promise<void> {
    // 1. 修改 react-native-permissions types
    this.patchTypesFields();
  }

  /**
   * 修改 react-native-permissions 的 types 字段
   */
  private patchTypesFields(): void {
    const permissionsTypesPath = path.join(
      this.cwd,
      "node_modules",
      "@react-native-ohos",
      "react-native-permissions",
      "dist",
      "typescript",
      "index.d.ts"
    );
    this.patchPackageTypes(
      "react-native-permissions",
      "../@react-native-ohos/react-native-permissions/dist/typescript/index.d.ts",
      permissionsTypesPath
    );
  }
}

