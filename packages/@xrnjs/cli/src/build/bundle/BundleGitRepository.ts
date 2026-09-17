import * as path from "path";
import { timingTracker } from "../TimingTracker";
import {
  BuildType,
  BundleType,
  Platform,
  RepInfo,
  TimingTrackerStage,
} from "../typing";
import logger from "../../utlis/logger";
import { execInherit, execShellCommand } from "../utils/shell";
import { buildBusinessBundle } from "./buildBusinessBundle";
import { buildJobContext } from "../BuildJobContext";
import { moveResToNative, removeDirAndCreateEmptyDir } from "../utils/file";
import { checkBundleDependencies } from "../utils/bundleDependencies";
import { generateBundleResourceBaseLine } from "../../codePush/diff";
import { getBundleMapName, getBundleName } from "./utils";
import { GitRepository } from "../utils/GitRepository";
import fs from "fs-extra";
import { BaseLineFileType } from "../BaselineManager";
import { zipDirectory } from "../../utlis/archiveZip";
import { isProd } from "../utils";
import { validateXtRnCorePatches } from "../utils/patchesValidator";

export class BundleGitRepository {
  public bundleName: string;
  private branchName: string;
  private bundlePackagePath: string;
  private bundleOutputPath: string;
  private bundleJsFileName: string;
  private bundleMapFileName: string;
  private bundleType: BundleType;
  private bundleOutputDirName: string;
  private checkNativeDep: boolean;
  private bundleRegistry: GitRepository = null;
  private prepareCommand: string;

  constructor(repInfo: RepInfo) {
    const { platform, rootPath } = buildJobContext;
    const {
      bundlePackageRelativePath = "",
      checkNativeDep = true,
    } = repInfo;
    this.bundleName = repInfo.name;
    this.bundleType = repInfo.bundleType;
    this.branchName = repInfo.branchName;
    this.prepareCommand = repInfo.prepareCommand;

    if (repInfo.gitUrl) {
      this.bundleRegistry = new GitRepository({
        branchName: this.branchName,
        repositoryUrl: repInfo.gitUrl,
        repositoryName: this.bundleName,
      });
    }

    this.checkNativeDep = checkNativeDep;

    this.bundleOutputDirName = `release_${platform}`;

    this.bundlePackagePath = path.join(
      this.bundleRegistry?.gitRepoPath || rootPath,
      bundlePackageRelativePath
    );

    this.bundleOutputPath = path.join(
      this.bundlePackagePath,
      this.bundleOutputDirName
    );

    this.bundleJsFileName = getBundleName(platform, this.bundleName);
    this.bundleMapFileName = getBundleMapName(platform, this.bundleName);
  }

  private clearBundleOutputPath() {
    removeDirAndCreateEmptyDir(this.bundleOutputPath);
  }

  private async build(): Promise<void> {
    const { verbose, platform, buildType } = buildJobContext;

    // 替换为实际的打包命令
    // await execAsync(`npm run build --prefix ${this.localPath}`);

    const assetsDestMap: Record<Platform, string> = {
      [Platform.iOS]: `${this.bundleOutputPath}/`,
      [Platform.Android]: `${this.bundleOutputPath}/res/`,
      [Platform.Harmony]: `${this.bundleOutputPath}/assets/assets`,
    };

    const assetsDest = assetsDestMap[platform];

    await buildBusinessBundle({
      platform,
      name: this.bundleName,
      output: this.bundleOutputPath,
      root: this.bundlePackagePath,
      assetsDest: assetsDest,
      verbose,
      dev: buildType === BuildType.DEBUG,
      meta: buildJobContext.meta,
      env: buildJobContext.buildEnv,
      hermes: buildJobContext.hermes,
    });
  }

  public async buildBundle() {
    this.info("开始构建");

    if (this.prepareCommand) {
      await execInherit(this.prepareCommand, {
        cwd: this.bundlePackagePath,
      });
    }

    await this.trackTiming(TimingTrackerStage.BUNDLE_BUILDING, async () => {
      await this.build();
    });
  }

  public async initRepository() {
    await this.bundleRegistry?.initRepository();
  }

  public async initialize(): Promise<void> {
    // 删除 release_${platform} 目录
    try {
      this.clearBundleOutputPath();
    } catch (error) {
      this.error(`初始化 ${this.bundleName} 仓库失败: ${error?.message}`);
      throw error;
    }
  }

  public async installPackages() {
    this.info(`下载依赖 ${this.bundlePackagePath}`);
    if (this.bundleRegistry) {
      // 远端仓库，统一 yarn 版本
      // const version = await execShellCommand(`yarn --version`, {
      //   cwd: this.bundleRegistry.gitRepoPath,
      // });
      // if (!version.startsWith("1.")) {
      //   await execInherit(`yarn set version 1.22.22`, {
      //     cwd: this.bundleRegistry.gitRepoPath,
      //   });
      // }
      await execInherit(`yarn`, {
        cwd: this.bundleRegistry.gitRepoPath,
      });
    }

    if (this.bundleRegistry?.gitRepoPath !== this.bundlePackagePath) {
      await execInherit(`yarn`, {
        cwd: this.bundlePackagePath,
      });
    }
  }

  public async checkBundleDependencies() {
    const { platform, nativeDeps, reactNativeConfigDeps, buildEnv } =
      buildJobContext;


    // 比较是否新增原生依赖
    if (this.checkNativeDep) {
      return await checkBundleDependencies({
        bundleName: this.bundleName,
        bundlePath: this.bundlePackagePath,
        platform,
        nativeDeps,
        reactNativeConfigDeps,
        checkLevel: isProd(buildEnv) ? "strict" : "minor",
        allowNewPackage: false,
        allowBundleVersionLowerThanNative: false,
      });
    }
  }

  public validateXtRnCorePatches(): boolean {
    const { rootPath } = buildJobContext;

    // 校验原生项目和 bundle 项目的 @xrnjs/core/patches 是否一致
    return validateXtRnCorePatches({
      nativeRootPath: rootPath,
      bundlePath: this.bundlePackagePath,
      bundleName: this.bundleName,
    });
  }

  /**
   * 处理 bundle
   *
   * 这个函数处理 bundle 打包产物，包括生成 baseline，移动 bundle 和资源文件。
   *
   */
  async processBundleResults() {
    const { platform, buildType, rootPath, baselineManager } =
      buildJobContext;
    const bundleDirName = `release_${platform}`;
    const bundlePath = this.bundleOutputPath;

    this.info(
      `processBundle: ${this.bundleName}, ${this.bundleJsFileName}, ${this.bundleMapFileName}`
    );

    const jsPath = path.join(bundlePath, this.bundleJsFileName);
    // 基线压缩包属于临时产物，不放入 release_${platform} 业务产物目录。
    const tempWorkDir = path.join(bundlePath, `.basepkg_temp_${Date.now()}`);
    const releaseDir = path.join(tempWorkDir, `release_${platform}`);
    await fs.ensureDir(releaseDir);
    await fs.copy(jsPath, path.join(releaseDir, this.bundleJsFileName));
    const zipOutputPath = path.join(tempWorkDir, `release_${platform}.zip`);
    await zipDirectory(releaseDir, zipOutputPath);
    // 以 zip 产物调用 moveFileToTempDir，autoGenerateHash:true 从 zip 内容生成 hash 供服务端去重判断
    await baselineManager.moveFileToTempDir(
      BaseLineFileType.BASE_PACKAGE,
      zipOutputPath,
      this.bundleName,
      {
        dirName: this.bundleName,
      }
    );
    // 基线目录中已有正式副本，清理全部临时产物。
    await fs.remove(tempWorkDir);

    // 注册 HBC_BASELINE 基线，供热更新使用 -base-bytecode 优化 diff 体积（仅 Hermes 编译开启时才有 HBC 产物）
    if (buildJobContext.hermes) {
      const hbcInfo = baselineManager.getBundleBaselineInfo(this.bundleName, BaseLineFileType.HBC_BASELINE);
      await baselineManager.moveFileToTempDir(
        BaseLineFileType.HBC_BASELINE,
        jsPath,
        this.bundleName,
        {
          rename: hbcInfo.fileName,
          dirName: this.bundleName,
        }
      );
    } else {
      logger.info(`[HBC_BASELINE] Hermes 编译未开启，跳过 HBC_BASELINE 注册: ${this.bundleName}`);
    }

    if (buildType === BuildType.RELEASE) {
      // 根据release_ios 生成baseline 【此时只有 bundle文件 和 assets 文件】
      await generateBundleResourceBaseLine(
        this.bundleName,
        this.bundleOutputPath,
        baselineManager
      );
    }

    if (platform == Platform.iOS) {
      //3. 移动bundle资源
      const iosAppBundleReleasePath =
        this.bundleType == BundleType.main
          ? `${rootPath}/${bundleDirName}`
          : `${rootPath}/ios/subBundles`;

      await execShellCommand(
        `cp ${bundlePath}/${this.bundleJsFileName} ${iosAppBundleReleasePath}/${this.bundleJsFileName}`,
        { cwd: rootPath }
      );

      //4. 移动业务图片资源
      await moveResToNative(
        `${this.bundleOutputPath}/assets`,
        `${rootPath}/release_ios/assets`
      );
    } else if (platform === Platform.Harmony) {
      // 把 map 文件删了
      await fs.remove(`${bundlePath}/${this.bundleMapFileName}`);

      await fs.copy(
        `${bundlePath}/`,
        `${rootPath}/harmony/entry/src/main/resources/rawfile/`,
        {
          overwrite: true,
        }
      );
      // await execShellCommand(
      //   `mv ${bundlePath}/${this.bundleJsFileName} ${rootPath}/harmony/entry/src/main/resources/rawfile`,
      //   { cwd: rootPath }
      // );
      // moveResToNative(
      //   `${this.bundleOutputPath}/res`,
      //   `${rootPath}/harmony/entry/src/main/resources/rawfile/assets`
      // );
      // if (fs.existsSync(`${bundlePath}/src`)) {
      //   moveResToNative(
      //     `${this.bundleOutputPath}/src`,
      //     `${rootPath}/harmony/entry/src/main/resources/rawfile/src`
      //   );
      // }
    } else {
      await execShellCommand(
        `cp ${bundlePath}/${this.bundleJsFileName} ${rootPath}/android/app/src/main/assets/${this.bundleJsFileName}`,
        { cwd: rootPath }
      );
      await moveResToNative(
        `${this.bundleOutputPath}/res`,
        `${rootPath}/android/app/src/main/res`
      );
    }
  }

  async trackTiming(stage: TimingTrackerStage, callback: () => Promise<void>) {
    await timingTracker.track({
      stage,
      instanceName: this.bundleName,
      callback,
    });
  }

  info(d: string) {
    const latestCommitId = this.bundleRegistry?.latestCommitId || "";
    logger.info(`【${this.bundleName} ${latestCommitId}】${d}`);
  }

  error(d: string) {
    const latestCommitId = this.bundleRegistry?.latestCommitId || "";
    logger.error(`【${this.bundleName} ${latestCommitId}】${d}`);
  }
}
