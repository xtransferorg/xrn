#!/usr/bin/env node

import { BuildType, TimingTrackerStage } from "./typing";
import { buildJobContext } from "./BuildJobContext";
import { timingTracker } from "./TimingTracker";
import logger from "../utlis/logger";
import { prepareBundle } from "./bundle/prepareBundle";
import {
  generateNativeBaseLine,
  moveCommonBundleToBaseLine,
  generateSvgBaseLine,
  generateSignatureBaseLine,
  generateBundleResources,
} from "../codePush/diff";
import { execShellCommand } from "./utils/shell";
import { getBuilder } from "./builders";
import { prepareCommonBundle } from "./bundle/prepareCommonBundle";
import fs from "fs-extra";
import path from "path";

// ========== 主流程重构 =============

export async function build() {
  timingTracker.time(TimingTrackerStage.TOTAL);

  try {
    const { rootPath, buildType, shouldFirstCodePush, buildEnv } =
      buildJobContext;

    // 打印当前仓库 commit hash
    const commitId = await execShellCommand(`git rev-parse HEAD`, {
      cwd: rootPath,
    });
    logger.info("当前仓库 commit hash: " + commitId);


    // 清理各平台的 bundle 产物目录
    const builder = getBuilder();
    await builder.cleanBundleDir();

    // 准备 bundle
    const meta = await prepareCommonBundle();
    buildJobContext.meta = meta;

    // 构建 bundle
    await prepareBundle();

    // 构建原生包
    const buildResults = await builder.run();

    if (buildJobContext.nativeRoot) {
      await fs.ensureDir(buildJobContext.nativeRoot);
      for (const result of buildResults) {
        if (!result.filePath || result.fileName.endsWith(".manifest")) continue;
        await fs.copy(result.filePath, path.join(buildJobContext.nativeRoot, result.fileName), { overwrite: true });
      }
      logger.info(`安装包已复制到原生工程根目录: ${buildJobContext.nativeRoot}`);
    }

    // 生成原生基线依赖和 common meta 文件
    await generateNativeBaseLine(rootPath, meta);

    if (buildJobContext.unpacking) {
      await moveCommonBundleToBaseLine(rootPath);
    }

    if (buildJobContext.buildType === BuildType.RELEASE) {
      await generateSvgBaseLine(rootPath, buildJobContext);
      await generateBundleResources();
    }
    await generateSignatureBaseLine(rootPath, buildJobContext);
    // await commitDiffHash(rootPath, buildJobContext);

    logger.info("构建完成");

    timingTracker.timeEnd(TimingTrackerStage.TOTAL);

    return buildResults;
  } catch (error) {
    logger.error(error);
    timingTracker.timeEnd(TimingTrackerStage.TOTAL);
    process.exit(1);
  }
}
