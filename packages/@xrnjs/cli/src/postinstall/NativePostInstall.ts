import fs from "fs-extra";
import path from "path";
import { BasePostInstall } from "./BasePostInstall";
import logger from "../utlis/logger";
import { XrnConfig } from "./utils";
import { BundleConfigItem } from "../build/typing";

/**
 * 原生平台 PostInstall 基类
 * Android、iOS、Harmony 都继承此类
 */
export abstract class NativePostInstall extends BasePostInstall {
  protected xrnConfig: XrnConfig | null;

  constructor(cwd: string, platformName: string, xrnConfig: XrnConfig | null) {
    super(cwd, platformName);
    this.xrnConfig = xrnConfig;
  }

  /**
   * 平台特定任务 - 统一实现
   * 调用子类实现的 writeBundleConfig 方法
   */
  protected async runPlatformSpecificTasks(): Promise<void> {
    await Promise.resolve(this.writeBundleConfig(this.xrnConfig?.bundleConfig.bundles || []));
  }

  /**
   * 写入 bundle 配置（由子类实现具体逻辑）
   */
  abstract writeBundleConfig(bundles: BundleConfigItem[]): void;

  /**
   * 写入 JSON 格式的 bundle 配置
   */
  protected writeBundleConfigJSON(
    relativePath: string,
    fileName: string,
    bundles: BundleConfigItem[]
  ): void {
    logger.info(`写入 ${this.platformName} ${fileName}...`);

    const bundleConfigPath = path.join(this.cwd, relativePath, fileName);

    try {
      const bundleConfig = {
        bundles: bundles.map(
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          ({ name, gitUrl, ...rest }) => ({
            bundleName: name,
            ...rest,
          })
        ),
      };

      // 确保目录存在
      fs.ensureDirSync(path.dirname(bundleConfigPath));

      fs.writeFileSync(
        bundleConfigPath,
        JSON.stringify(bundleConfig, null, 2),
        "utf8"
      );

      logger.info(
        `✅ ${this.platformName} ${fileName} 写入成功: ${bundleConfigPath}`
      );
    } catch (error) {
      logger.error(`❌ 写入 ${this.platformName} ${fileName} 失败:`, error);
      throw error;
    }
  }
}

