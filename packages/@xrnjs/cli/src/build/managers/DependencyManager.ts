import logger from "../../utlis/logger";
import { Platform, DepInfo } from "../typing";
import {
  getAllNativeDeps,
  loadReactNativeConfigDeps,
  PackageJson,
  readPackageJsonSync,
} from "../utils/package";

/**
 * 依赖管理器
 * 负责加载和管理原生依赖信息
 */
export class DependencyManager {
  private packageJson: PackageJson;
  private nativeDeps: Record<string, DepInfo>;
  private reactNativeConfigDeps: Record<string, DepInfo>;
  private coreVersion: string;

  constructor(private rootPath: string) {}

  /**
   * 加载所有依赖信息
   */
  async loadDependencies(): Promise<void> {
    // 加载 package.json
    this.packageJson = readPackageJsonSync(this.rootPath);

    // 获取 core 版本
    this.coreVersion =
      this.packageJson.dependencies["@xrnjs/core"] ||
      this.packageJson.devDependencies["@xrnjs/core"];

    if (!this.coreVersion) {
      throw new Error("原生仓库请先安装 @xrnjs/core 依赖");
    }

    // 加载原生依赖
    const { nativeDeps, duplicateDeps } = getAllNativeDeps(
      this.rootPath,
      [Platform.Android, Platform.iOS, Platform.Harmony]
    );

    if (duplicateDeps.length > 0) {
      logger.warn(`原生仓库检测到重复依赖：${duplicateDeps.join(",")}`);
    }

    this.nativeDeps = nativeDeps;

    // 加载 react-native config 依赖
    this.reactNativeConfigDeps = await loadReactNativeConfigDeps(this.rootPath);

    logger.info(`[DependencyManager] 依赖信息加载完成`);
  }

  // Getters
  getPackageJson(): PackageJson {
    return this.packageJson;
  }

  getNativeDeps(): Record<string, DepInfo> {
    return this.nativeDeps;
  }

  getReactNativeConfigDeps(): Record<string, DepInfo> {
    return this.reactNativeConfigDeps;
  }

  getCoreVersion(): string {
    return this.coreVersion;
  }
}
