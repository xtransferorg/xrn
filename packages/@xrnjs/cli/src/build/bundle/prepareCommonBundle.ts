import { buildJobContext } from "../BuildJobContext";
import { DEFAULT_META_CONFIG } from "../constants/meta";
import { timingTracker } from "../TimingTracker";
import { Platform, TimingTrackerStage } from "../typing";
import { moveResToNative, removeDirAndCreateEmptyDir } from "../utils/file";
import { execShellCommand } from "../utils/shell";
import { buildCommonBundle } from "./buildCommonBundle";
import { getBundleName } from "./utils";
import { MetaConfig } from "./interface";
import logger from "../../utlis/logger";
import { BaseLineFileType } from "@xrnjs/code-push-core/dist/types";
import fs from "fs-extra";
import path from "path";
import {
  generateBundleResourceBaseLine,
  COMMON_BASE_KEY,
} from "../../codePush/diff";

export const prepareCommonBundle = async () => {
  timingTracker.time(TimingTrackerStage.PROCESS_COMMON_BUNDLE);
  const {
    platform,
    verbose,
    buildType,
    rootPath,
    unpacking,
  } = buildJobContext;

  const commonBundlePath = `${rootPath}/xt-app-common`;

  if (!unpacking) {
    timingTracker.timeEnd(TimingTrackerStage.PROCESS_COMMON_BUNDLE);
    return DEFAULT_META_CONFIG;
  }

  logger.info(`[prepareCommonBundle] 构建新的 common_bundle`);
  const meta: MetaConfig = await buildCommonBundle({
    platform,
    verbose,
    buildType,
    base: rootPath,
    buildEnv: buildJobContext.buildEnv,
    hermes: buildJobContext.hermes,
  });

  // 将 HBC 产物注册为 HBC_BASELINE 基线（fresh build 和 reuse 均需要，仅 Hermes 开启时才有 HBC 产物）
  if (buildJobContext.hermes) {
    const hbcSrcPath = path.join(commonBundlePath, `release_${platform}`, getBundleName(platform));
    if (fs.existsSync(hbcSrcPath)) {
      const hbcBaselineInfo = buildJobContext.baselineManager.getBundleBaselineInfo('xt-app-common', BaseLineFileType.HBC_BASELINE);
      await buildJobContext.baselineManager.moveFileToTempDir(
        BaseLineFileType.HBC_BASELINE,
        hbcSrcPath,
        'xt-app-common',
        {
          rename: hbcBaselineInfo.fileName,
          dirName: 'xt-app-common',
        }
      );
      logger.info(`[HBC_BASELINE] 已注册 HBC 基线: ${hbcBaselineInfo.filePath}`);
    } else {
      logger.warn(`[HBC_BASELINE] HBC 产物不存在，跳过注册: ${hbcSrcPath}`);
    }
  } else {
    logger.info(`[HBC_BASELINE] Hermes 编译未开启，跳过 HBC_BASELINE 注册`);
  }

  logger.info(`[prepareCommonBundle] common_bundle 构建完成，hash: ${meta.hash}`);

  timingTracker.timeEnd(TimingTrackerStage.PROCESS_COMMON_BUNDLE);

  await copyCommonBundle();

  await generateBundleResourceBaseLine(
    "xt-app-common",
    `${commonBundlePath}/release_${buildJobContext.platform}`,
    buildJobContext.baselineManager
  );

  return meta;
};

/** 将 common bundle 产物拷贝和移动到 rootPath/release_${platform}。 */
async function copyCommonBundle() {
  const { platform, rootPath } = buildJobContext;
  const commonBundlePath = `${rootPath}/xt-app-common`;

  if (platform == Platform.iOS) {
    // 拷贝 common bundle
    await execShellCommand(
      `cp ${commonBundlePath}/release_ios/${getBundleName(
        platform
      )} ${rootPath}/release_ios`,
      { cwd: rootPath }
    );
    // 移动 common bundle 资源文件
    await moveResToNative(
      `${commonBundlePath}/release_ios/assets`,
      `${rootPath}/release_ios/assets`
    );
  } else if (platform === Platform.Harmony) {
    const bundlePath = path.join(commonBundlePath, "release_harmony");
    const harmonyRawfileDir = path.join(
      rootPath,
      "harmony/entry/src/main/resources/rawfile"
    );
    const harmonyBundleFile = path.join(bundlePath, getBundleName(platform));
    const harmonyResDir = path.join(bundlePath, "res");
    const harmonyAssetsDir = path.join(harmonyRawfileDir, "assets/assets");

    // Harmony 要求 js bundle 与静态资源分开放置。
    await fs.copy(harmonyBundleFile, path.join(harmonyRawfileDir, getBundleName(platform)), {
      overwrite: true,
    });

    if (await fs.pathExists(harmonyResDir)) {
      await fs.copy(harmonyResDir, harmonyAssetsDir, {
        overwrite: true,
      });
    }
  } else {
    // 拷贝 common bundle
    await execShellCommand(
      `cp ${commonBundlePath}/release_android/${getBundleName(
        platform
      )} ${rootPath}/android/app/src/main/assets`,
      { cwd: rootPath }
    );
    // 移动 common bundle 资源文件
    await moveResToNative(
      `${commonBundlePath}/release_android/res`,
      `${rootPath}/android/app/src/main/res`
    );
  }
  return { commonBundlePath };
}
