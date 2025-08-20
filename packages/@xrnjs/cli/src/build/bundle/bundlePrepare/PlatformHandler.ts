import type { MetaConfig } from "../interface";
import { moveResToNative, removeDirAndCreateEmptyDir } from "../../utils/file";
import { Platform, BuildType, BundleType } from "../../typing";
import { execShellCommand } from "../../utils/shell";
import { getBundleName } from "../utils";
import { generateBusinessBaseLine } from "../../../codePush/diff";
import fs from "fs-extra";
import path from "path";
import { BuildJobContext } from "../../BuildJobContext";
import { BundleManager } from "./BundleManager";

export abstract class PlatformHandler {
  constructor(protected ctx: BuildJobContext) {}
  abstract clean(): Promise<void>;
  abstract copyCommonBundle(
    commonBundlePath: string,
    meta: MetaConfig,
  ): Promise<void>;
  abstract processBundleResults(bundleManager: BundleManager): Promise<void>;
}

export class IOSPlatformHandler extends PlatformHandler {
  async clean() {
    removeDirAndCreateEmptyDir(`${this.ctx.rootPath}/release_ios`);
  }
  async copyCommonBundle(commonBundlePath: string, meta: MetaConfig) {
    const { rootPath } = this.ctx;
    await execShellCommand(
      `cp ${commonBundlePath}/release_ios/${getBundleName(Platform.iOS)} ${rootPath}/release_ios`,
      { cwd: rootPath },
    );
    moveResToNative(
      `${commonBundlePath}/release_ios/assets`,
      `${rootPath}/release_ios/assets`,
    );
  }
  async processBundleResults(bundleManager: BundleManager) {
    const { rootPath, buildType } = this.ctx;
    const bundleDirName = `release_${Platform.iOS}`;
    const bundlePath = bundleManager.bundleOutputPath;
    if (buildType === BuildType.RELEASE) {
      await generateBusinessBaseLine(
        rootPath,
        bundleManager.bundleName,
        this.ctx
      );
    }
    const iosAppBundleReleasePath =
      bundleManager.bundleType === BundleType.main
        ? `${rootPath}/${bundleDirName}`
        : `${rootPath}/ios/subBundles`;
    fs.ensureDirSync(iosAppBundleReleasePath);
    await execShellCommand(
      `cp ${bundlePath}/${bundleManager.bundleJsFileName} ${iosAppBundleReleasePath}/${bundleManager.bundleJsFileName}`,
      { cwd: rootPath }
    );
    moveResToNative(
      `${bundleManager.bundleOutputPath}/assets`,
      `${rootPath}/release_ios/assets`
    );
  }
}

export class AndroidPlatformHandler extends PlatformHandler {
  async clean() {
    const assetsPath = `${this.ctx.rootPath}/android/app/src/main/assets`;
    const files = await fs.readdir(assetsPath);
    for (const file of files) {
      if (file.endsWith(".bundle")) {
        await fs.unlink(path.join(assetsPath, file));
      }
    }
  }
  async copyCommonBundle(commonBundlePath: string, meta: MetaConfig) {
    const { rootPath } = this.ctx;
    await execShellCommand(
      `cp ${commonBundlePath}/release_android/${getBundleName(Platform.Android)} ${rootPath}/android/app/src/main/assets`,
      { cwd: rootPath },
    );
    moveResToNative(
      `${commonBundlePath}/release_android/res`,
      `${rootPath}/android/app/src/main/res`,
    );
  }
  async processBundleResults(bundleManager: BundleManager) {
    const { rootPath } = this.ctx;
    const bundlePath = bundleManager.bundleOutputPath;
    await execShellCommand(
      `cp ${bundlePath}/${bundleManager.bundleJsFileName} ${rootPath}/android/app/src/main/assets/${bundleManager.bundleJsFileName}`,
      { cwd: rootPath }
    );
    moveResToNative(
      `${bundleManager.bundleOutputPath}/res`,
      `${rootPath}/android/app/src/main/res`
    );
  }
}

export class HarmonyPlatformHandler extends PlatformHandler {
  async clean() {
    const rawfilePath = `${this.ctx.rootPath}/harmony/entry/src/main/resources/rawfile`;
    const files = await fs.readdir(rawfilePath);
    for (const file of files) {
      if (file.endsWith(".bundle")) {
        await fs.unlink(path.join(rawfilePath, file));
      }
    }
  }
  async copyCommonBundle(commonBundlePath: string, meta: MetaConfig) {
    // Harmony 平台暂未实现 common bundle 复制，如有需要可补充
  }
  async processBundleResults(bundleManager: BundleManager) {
    const { rootPath } = this.ctx;
    const bundlePath = bundleManager.bundleOutputPath;
    await fs.remove(`${bundlePath}/${bundleManager.bundleMapFileName}`);
    await fs.copy(
      `${bundlePath}/`,
      `${rootPath}/harmony/entry/src/main/resources/rawfile/`,
      {
        overwrite: true,
      }
    );
  }
}

export function createPlatformHandler(ctx: BuildJobContext): PlatformHandler {
  switch (ctx.platform) {
    case Platform.iOS:
      return new IOSPlatformHandler(ctx);
    case Platform.Android:
      return new AndroidPlatformHandler(ctx);
    case Platform.Harmony:
      return new HarmonyPlatformHandler(ctx);
    default:
      throw new Error(`未知平台: ${ctx.platform}`);
  }
} 