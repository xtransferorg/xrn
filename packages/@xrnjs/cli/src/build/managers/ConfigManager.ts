import { XRNConfigType, BuildType, Platform, AppFormat, BuildEnv, RepInfo, BundleType } from "../typing";
import { isProd } from "../utils";
import logger from "../../utlis/logger";
import { createNativePostInstall } from "../../postinstall";

/**
 * 配置管理器
 * 负责加载和管理 xrn.config.json 配置（包括 Bundle 配置）
 */
export class ConfigManager {
  private config: XRNConfigType;
  private rootPath: string;
  private subBundle: Array<RepInfo> = [];

  constructor(
    rootPath: string,
    private platform: Platform,
    private branchName: string,
    private buildEnv: BuildEnv
  ) {
    this.rootPath = rootPath;
  }

  /**
   * 加载 xrn.config.json 配置
   */
  loadConfig(): XRNConfigType {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    this.config = require(`${this.rootPath}/xrn.config.json`) as XRNConfigType;
    return this.config;
  }

  /**
   * 获取配置
   */
  getConfig(): XRNConfigType {
    if (!this.config) {
      throw new Error("配置未加载，请先调用 loadConfig()");
    }
    return this.config;
  }

  /**
   * 获取应用版本号
   */
  getAppVersion(): string {
    const version = this.config.appVersion;
    if (!version || version.length <= 0) {
      throw new Error("xrn.config.json 中未配置 appVersion");
    }
    return version;
  }

  /**
   * 获取应用名称
   */
  getAppName(): string {
    const appName = this.config.appName;
    if (appName.length <= 0) {
      throw new Error("xrn.config.json 中 appName 字段配置存在问题");
    }
    return appName;
  }

  /**
   * 获取 AppKey
   */
  getAppKey(platform: Platform, buildType: BuildType, channel: string): string {
    let appKey: string;

    if (platform === Platform.iOS) {
      appKey = this.config.iosUpdateAppKey[buildType];
    } else if (platform === Platform.Android) {
      const keyInfo = this.config.androidUpdateAppKey[buildType];
      appKey = keyInfo?.[channel] || keyInfo?.default;
    } else if (platform === Platform.Harmony) {
      appKey = this.config.harmonyUpdateAppKey[buildType];
    }

    if (!appKey) {
      throw new Error("appKey 不存在，请检查 xrn.config.json 配置");
    }

    return appKey;
  }

  /**
   * 是否使用本地 Bundle 配置
   */
  shouldUseLocalBundleConfig(): boolean {
    return this.config.useLocalBundleConfig ?? true;
  }

  /**
   * 是否启用拆包
   */
  shouldUnpack(): boolean {
    return this.config.unpacking ?? true;
  }

  /**
   * 获取 Bundle 配置
   */
  getBundleConfig() {
    return this.config.bundleConfig;
  }

  /**
   * 加载 bundle 配置
   */
  loadBundleConfig(bundlesFilter?: string): void {
    const bundleConfig = this.getBundleConfig();
    const bundles = bundleConfig.bundles;
    const bundleDefaultOptions = bundleConfig.defaultOptions;

    let filteredBundles = bundles;

    // 根据 bundles 参数过滤
    if (bundlesFilter && bundlesFilter !== "all") {
      const bundleNames = bundlesFilter
        .split(",")
        .map((name) => name.trim());
      
      const originalCount = bundles.length;
      filteredBundles = bundles.filter((bundle) =>
        bundleNames.includes(bundle.name)
      );

      logger.info(
        `根据 bundles 参数过滤：原有 ${originalCount} 个 bundle，过滤后 ${filteredBundles.length} 个 bundle: ${filteredBundles.map((b) => b.name).join(", ")}`
      );

      // 验证是否所有指定的 bundle 都存在
      const foundBundleNames = filteredBundles.map((b) => b.name);
      const notFoundBundles = bundleNames.filter(
        (name) => !foundBundleNames.includes(name)
      );
      
      if (notFoundBundles.length > 0) {
        logger.warn(
          `以下指定的 bundle 不存在: ${notFoundBundles.join(", ")}`
        );
      }

      // 写入过滤后的 bundle 配置到原生
      const postInstall = createNativePostInstall(
        this.platform,
        this.rootPath,
        null
      );
      postInstall.writeBundleConfig(filteredBundles);
    }

    // 转换为 RepInfo 格式
    this.subBundle = filteredBundles.map((bundleInfo) => {
      return {
        name: bundleInfo.name,
        branchName: this.branchName,
        gitUrl: bundleInfo.gitUrl,
        bundleType:
          (bundleInfo.bundleType as BundleType) ??
          bundleDefaultOptions.bundleType,
        prepareCommand:
          bundleInfo.prepareCommand ?? bundleDefaultOptions.prepareCommand,
        useCommonBundle: bundleInfo.useCommonBundle ?? true,
        bundlePackageRelativePath: bundleInfo.bundlePackageRelativePath,
        checkNativeDep: bundleInfo.checkNativeDep ?? true,
      };
    });

    logger.info(
      `[ConfigManager] 加载了 ${this.subBundle.length} 个 bundle: ${this.subBundle.map((b) => b.name).join(", ")}`
    );
  }

  /**
   * 获取 SubBundles
   */
  getSubBundles(): Array<RepInfo> {
    return this.subBundle;
  }

  /**
   * 获取 Bundle 名称列表（字符串）
   */
  getBundleNames(): string {
    return this.subBundle.map((item) => item.name).join(", ");
  }

  /**
   * 判断 AppFormat（如果未传递）
   */
  static determineAppFormat(
    platform: Platform,
    buildEnv: BuildEnv,
    channel: string,
    providedFormat?: AppFormat
  ): AppFormat {
    if (providedFormat) {
      return providedFormat;
    }

    if (platform === Platform.Android) {
      const allAabChannels = ["googlePlay", "huawei"];
      return allAabChannels.includes(channel) ? AppFormat.aab : AppFormat.apk;
    } else if (platform === Platform.iOS) {
      return AppFormat.ipa;
    } else if (platform === Platform.Harmony) {
      return isProd(buildEnv) ? AppFormat.app : AppFormat.hap;
    }

    throw new Error(`未知的平台`);
  }
}
