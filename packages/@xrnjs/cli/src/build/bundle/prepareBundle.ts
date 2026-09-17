import { TimingTrackerStage } from "../typing";

import logger from "../../utlis/logger";
import { execShellCommand } from "../utils/shell";

import { buildJobContext } from "../BuildJobContext";
import { timingTracker } from "../TimingTracker";
import { BundleGitRepository } from "./BundleGitRepository";

/**
 * 准备 bundle
 *
 * 这个函数准备多个子 bundle，并行处理每个子 bundle，构建并移动资源文件。
 *
 */
export async function prepareBundle() {
  // timingTracker.time(TimingTrackerStage.BUNDLE_PREPARE);

  const { verbose, subBundle } = buildJobContext;

  const bundleInstances = subBundle.map((item) => {
    const bundleGitRepository = new BundleGitRepository(item);
    return bundleGitRepository;
  });

  // 初始化每个子 bundle 的仓库
  for (const item of bundleInstances) {
    await item.initRepository();
  }

  // 构建 common 包，并将其拷贝和移动到指定位置
  // 必须在基线仓库拉取完成后开始，因为 common 包需要 lock 文件

  verbose && logger.info("开始构建 bundle");

  // 批量处理子 bundle
  timingTracker.time(TimingTrackerStage.PROCESS_SUB_BUNDLES);

  // 并行拉取仓库、安装依赖等
  await prepareBundleTasksCreator(bundleInstances);

  // 串行构建 bundle
  await processBundleBuilds(bundleInstances);

  // 并行处理打包产物
  await processBundleResultsTasks(bundleInstances);

  timingTracker.timeEnd(TimingTrackerStage.PROCESS_SUB_BUNDLES);

  return;
}

// 并行处理产物可能会有问题，改成串行处理
async function processBundleResultsTasks(
  bundleInstances: BundleGitRepository[],
) {
  timingTracker.time(TimingTrackerStage.PROCESS_BUNDLE_RESULTS);
  const tasks = bundleInstances.map(
    (bundleGitRepository) => async () => {
      // 处理 bundle 打包产物，包括生成 baseline，移动 bundle 和资源文件。
      await bundleGitRepository.processBundleResults();
    }
  );
  for (const task of tasks) {
    await task();
  }
  timingTracker.timeEnd(TimingTrackerStage.PROCESS_BUNDLE_RESULTS);
}

async function processBundleBuilds(
  bundleInstances: BundleGitRepository[]
) {
  const tasks = bundleInstances.map(
    (bundleGitRepository) => async () => {
      // 仓库打包
      await bundleGitRepository.buildBundle();

      await execShellCommand("watchman watch-del-all");
    }
  );
  for (const task of tasks) {
    await task();
  }
}

async function prepareBundleTasksCreator(
  bundleInstances: BundleGitRepository[]
) {
  timingTracker.time(TimingTrackerStage.REPO_INITIALIZE);
  const initBundleRepoTasks = bundleInstances.map(
    (bundleGitRepository) => async () => {
      // 仓库初始化准备
      await bundleGitRepository.initialize();

    }
  );

  const installTasks = bundleInstances.map(
    (bundleGitRepository) => async () => {
      // 依赖安装
      await bundleGitRepository.installPackages();
    }
  );

  const checkErrorBundles: string[] = [];
  const checkBundleTasks = bundleInstances.map(
    (bundleGitRepository) => async () => {
      // 检查 bundle 依赖
      const checkError = await bundleGitRepository.checkBundleDependencies();
      if (checkError) {
        checkErrorBundles.push(bundleGitRepository.bundleName);
      }
    }
  );

  const patchesErrorBundles: string[] = [];
  const checkPatchesTasks = bundleInstances.map(
    (bundleGitRepository) => async () => {
      // 校验 @xrnjs/core/patches 是否一致
      const isPatchesValid = bundleGitRepository.validateXtRnCorePatches();
      if (!isPatchesValid) {
        patchesErrorBundles.push(bundleGitRepository.bundleName);
      }
      return Promise.resolve();
    }
  );
  for (const task of initBundleRepoTasks) {
    await task();
  }

  for (const task of installTasks) {
    await task();
  }

  for (const task of checkBundleTasks) {
    await task();
  }

  for (const task of checkPatchesTasks) {
    await task();
  }

  if (checkErrorBundles.length > 0) {
    logger.error("原生依赖校验失败", { checkErrorBundles });
    throw new Error("原生依赖校验失败");
  }

  timingTracker.timeEnd(TimingTrackerStage.REPO_INITIALIZE);
}
