import fs from "fs-extra";
import path from "path";
import logger from "../utlis/logger";
import { execInherit } from "../build/utils/shell";

/**
 * PostInstall 基类
 * 所有平台的 postinstall 都继承此基类
 */
export abstract class BasePostInstall {
  protected cwd: string;
  protected platformName: string;

  constructor(cwd: string, platformName: string) {
    this.cwd = cwd;
    this.platformName = platformName;
  }

  /**
   * 主执行方法
   */
  async run(options: { skipPatches?: boolean; skipCommonTasks?: boolean } = {}): Promise<void> {
    logger.info(`开始执行 ${this.platformName} 平台的 postinstall...`);
    logger.info(`当前工作目录: ${this.cwd}`);

    try {
      // 1. 所有平台都应用 @xrnjs/core/patches
      if (!options.skipPatches) {
        await this.applyXtRnCorePatches();
      } else {
        logger.info("跳过 @xrnjs/core/patches 应用");
      }

      // 2. 执行平台通用的额外操作
      if (!options.skipCommonTasks) {
        await this.runCommonTasks();
      } else {
        logger.info("跳过通用任务执行");
      }

      // 3. 执行平台特定的操作
      await this.runPlatformSpecificTasks();

      logger.info(`✅ ${this.platformName} 平台 postinstall 执行完成`);
    } catch (error) {
      logger.error(`❌ ${this.platformName} 平台 postinstall 执行失败:`, error);
      throw error;
    }
  }

  /**
   * 应用 @xrnjs/core/patches
   */
  protected async applyXtRnCorePatches(): Promise<void> {
    logger.info("开始应用 @xrnjs/core/patches...");

    const xtRnCorePath = path.join(this.cwd, "node_modules", "@xrnjs/core");
    const patchesPath = path.join(xtRnCorePath, "patches");

    if (!fs.existsSync(patchesPath)) {
      logger.warn(`@xrnjs/core/patches 目录不存在: ${patchesPath}`);
      return;
    }

    try {
      const patchPackage = path.join(this.cwd, "node_modules", ".bin", "patch-package");
      await execInherit(`\"${patchPackage}\" --patch-dir node_modules/@xrnjs/core/patches`, { cwd: this.cwd });
      logger.info("✅ @xrnjs/core/patches 应用成功");
    } catch (error) {
      logger.error("❌ 应用 @xrnjs/core/patches 失败:", error);
      throw error;
    }
  }

  /**
   * 通用任务执行（子类可覆盖）
   * 默认执行 SensorsData Hook 和 xt-rn-icon generate
   */
  protected async runCommonTasks(): Promise<void> {
    //
  }

  /**
   * 通用：修改某个包的 types 字段
   */
  protected patchPackageTypes(
    packageName: string,
    typesField: string,
    typesPath: string
  ): void {
    const pkgPath = path.join(
      this.cwd,
      "node_modules",
      packageName,
      "package.json"
    );

    if (!fs.existsSync(pkgPath)) {
      logger.warn(`package.json 不存在: ${pkgPath}`);
      return;
    }

    if (!fs.existsSync(typesPath)) {
      logger.warn(`types 目标不存在: ${typesPath}`);
      return;
    }

    try {
      const pkgContent = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
      pkgContent.types = typesField;
      fs.writeFileSync(pkgPath, JSON.stringify(pkgContent, null, 2));
      logger.info(`✅ 已更新 ${packageName} 的 types 字段`);
    } catch (err) {
      logger.error(`❌ 更新 ${packageName} types 字段失败:`, err);
    }
  }

  /**
   * 平台特定任务（必须由子类实现）
   */
  protected abstract runPlatformSpecificTasks(): Promise<void>;
}
