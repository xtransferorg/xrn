import type { MetaConfig } from "../interface";
import { DEFAULT_META_CONFIG } from "../../constants/meta";
import logger from "../../../utlis/logger";
import { execShellCommand } from "../../utils/shell";
import { buildCommonBundle } from "../buildCommonBundle";
import { BuildJobContext } from "../../BuildJobContext";
import { BundleManager } from "./BundleManager";
import { PlatformHandler, createPlatformHandler } from "./PlatformHandler";
import { TaskRunner } from "./TaskRunner";

export class BundlePreparer {
  private buildJobContext: BuildJobContext;
  private meta: MetaConfig = DEFAULT_META_CONFIG;
  private platformHandler: PlatformHandler;
  private bundleInstances: BundleManager[] = [];

  constructor(buildJobContext: BuildJobContext) {
    this.buildJobContext = buildJobContext;
    this.platformHandler = createPlatformHandler(buildJobContext);
  }

  async run() {
    const {
      project,
      platform,
      version,
      buildEnv,
      buildType,
      verbose,
      rootPath,
      subBundle,
      unpacking,
    } = this.buildJobContext;

    const commonBundlePath = `${rootPath}/xt-app-common`;
    if (unpacking) {
      this.meta = await buildCommonBundle({
        platform,
        verbose,
        version,
        project,
        buildEnv,
        buildType,
        base: rootPath,
      });
    } else {
      this.meta = DEFAULT_META_CONFIG;
    }

    await this.platformHandler.clean();

    this.bundleInstances = subBundle.map((item) => {
      const bundleManager = new BundleManager(item, {
        meta: this.meta,
        platformHandler: this.platformHandler,
      });
      return bundleManager;
    });

    await this.prepareBundleTasks();
    await this.buildBundles();
    await this.processBundleResults();

    if (unpacking) {
      await this.platformHandler.copyCommonBundle(commonBundlePath, this.meta);
    }

    return { meta: this.meta };
  }

  // 仓库初始化、依赖安装、依赖检查
  private async prepareBundleTasks() {
    // 1. 初始化仓库（并发）
    await TaskRunner.all(
      this.bundleInstances.map((bundleManager) => async () => {
        await bundleManager.initialize();
      }),
    );
    // 2. 安装依赖（串行）
    await TaskRunner.series(
      this.bundleInstances.map((bundleManager) => async () => {
        await bundleManager.installPackages();
      }),
    );
    // 3. 检查依赖（串行）
    const checkErrorBundles: string[] = [];
    await TaskRunner.series(
      this.bundleInstances.map((bundleManager) => async () => {
        const checkError = await bundleManager.checkBundleDependencies();
        if (checkError) {
          checkErrorBundles.push(bundleManager.bundleName);
        }
      }),
    );
    if (checkErrorBundles.length > 0) {
      throw new Error(`原生依赖校验失败: ${checkErrorBundles.join(", ")}`);
    }
  }

  // 打包（串行）
  private async buildBundles() {
    const { cleanWatchMan } = this.buildJobContext;
    await TaskRunner.series(
      this.bundleInstances.map((bundleManager) => async () => {
        await bundleManager.build();
        if (cleanWatchMan) {
          await execShellCommand("watchman watch-del-all");
        }
      }),
    );
  }

  // 处理产物（串行）
  private async processBundleResults() {
    await TaskRunner.series(
      this.bundleInstances.map((bundleManager) => async () => {
        await bundleManager.processBundleResults();
      }),
    );
  }
}
