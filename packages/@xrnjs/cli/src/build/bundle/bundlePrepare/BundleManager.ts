import * as path from "path";
import { BuildType, BundleType, Platform, RepInfo } from "../../typing";
import logger from "../../../utlis/logger";
import { execInherit, execShellCommand } from "../../utils/shell";
import { buildBusinessBundle } from "../buildBusinessBundle";
import { buildJobContext } from "../../BuildJobContext";
import { MetaConfig } from "../interface";
import { removeDirAndCreateEmptyDir } from "../../utils/file";
import { checkBundleDependencies } from "../../utils/package";
import { getBundleMapName, getBundleName } from "../utils";
import { GitRepository } from "../../utils/GitRepository";
import fs from "fs-extra";
import { PlatformHandler } from "./PlatformHandler";

export class BundleManager {
  public bundleName: string;
  private branchName: string;
  public bundlePackagePath: string;
  public bundleOutputPath: string;
  public bundleJsFileName: string;
  public bundleMapFileName: string;
  public bundleType: BundleType;
  private bundleOutputDirName: string;
  private checkNativeDep: boolean;
  public meta: MetaConfig;
  private bundleRegistry: GitRepository = null;
  private platformHandler: PlatformHandler;

  constructor(
    repInfo: RepInfo,
    config: {
      meta?: MetaConfig;
      platformHandler: PlatformHandler;
    },
  ) {
    const { meta, platformHandler } = config;
    const { platform, rootPath } = buildJobContext;
    const { bundlePackageRelativePath = "", checkNativeDep = true } = repInfo;
    this.bundleName = repInfo.name;
    this.bundleType = repInfo.bundleType;
    this.branchName = repInfo.branchName;

    if (repInfo.gitUrl) {
      this.bundleRegistry = new GitRepository({
        branchName: this.branchName,
        repositoryUrl: repInfo.gitUrl,
        repositoryName: this.bundleName,
      });
    }

    this.checkNativeDep = checkNativeDep;
    this.meta = meta;
    this.platformHandler = platformHandler;

    this.bundleOutputDirName = `release_${platform}`;

    this.bundlePackagePath = path.join(
      this.bundleRegistry?.gitRepoPath || rootPath,
      bundlePackageRelativePath,
    );

    this.bundleOutputPath = path.join(
      this.bundlePackagePath,
      this.bundleOutputDirName,
    );

    this.bundleJsFileName = getBundleName(platform, this.bundleName);
    this.bundleMapFileName = getBundleMapName(platform, this.bundleName);
  }

  private clearBundleOutputPath() {
    removeDirAndCreateEmptyDir(this.bundleOutputPath);
  }

  public async build(): Promise<void> {
    const { verbose, platform, buildType } = buildJobContext;

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
      meta: this.meta,
      env: buildJobContext.buildEnv,
    });
  }

  public async initialize(): Promise<void> {
    // 删除 release_${platform} 目录
    try {
      await this.bundleRegistry?.initRepository();
    //   this.appJsonConfig = await readAppJsonFile(this.bundlePackagePath);
      this.clearBundleOutputPath();
    } catch (error) {
      this.error(`初始化 ${this.bundleName} 仓库失败: ${error?.message}`);
      throw error;
    }
  }

  public async installPackages() {
    this.info(`下载依赖 ${this.bundlePackagePath}`);
    try {
      if (this.bundleRegistry) {
        // 远端仓库，统一 yarn 版本
        const version = await execShellCommand(`yarn --version`, {
          cwd: this.bundleRegistry.gitRepoPath,
        });
        if (!version.startsWith("1.")) {
          await execInherit(`yarn set version 1.22.22`, {
            cwd: this.bundleRegistry.gitRepoPath,
          });
        }
        await execInherit(`yarn`, {
          cwd: this.bundleRegistry.gitRepoPath,
        });
      }
    } catch (err) {
      this.info(
        `${this.bundleName} 下载依赖失败，错误信息：${err?.message}, 尝试删除 node_modules 重新下载`,
      );
      // 异步删除 node_modules 重新下载
      await fs.remove(`${this.bundlePackagePath}/node_modules`);

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
    const { platform, nativeDeps } = buildJobContext;

    // 比较是否新增原生依赖
    if (this.checkNativeDep) {
      return await checkBundleDependencies({
        bundleName: this.bundleName,
        bundlePath: this.bundlePackagePath,
        platform,
        nativeDeps,
      });
    }
  }

  async processBundleResults() {
    await this.platformHandler.processBundleResults(this);
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
