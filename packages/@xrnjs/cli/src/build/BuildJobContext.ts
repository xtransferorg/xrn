import path from "path";
import logger from "../utlis/logger";
import {
  AppFormat,
  BuildEnv,
  BuildCommandOptions,
  BuildType,
  Platform,
  RepInfo,
  DepInfo,
} from "./typing";
import { PackageJson } from "./utils/package";
import { MetaConfig } from "./bundle/interface";
import { BaselineManager } from "./BaselineManager";
import { BaselineManagerFactory } from "./BaselineManagerFactory";
import {
  ConfigManager,
  VersionManager,
  DependencyManager,
} from "./managers";

/**
 * 构建任务上下文
 * 使用组合模式，将不同职责委托给专门的管理器
 */
export class BuildJobContext {
  // ==================== 基本信息 ====================
  /** 项目名称 */
  project: string;

  /** 平台 */
  platform: Platform;

  /** 构建环境 */
  buildEnv: BuildEnv;

  /** 同步目标环境 */
  syncTargetEnv?: BuildEnv;

  /** 构建类型 */
  buildType: BuildType;

  /** 分支名称 */
  branchName: string;

  /** 渠道 */
  channel: string;

  /** 渠道列表 */
  channelList: string[];

  /** App 格式 */
  appFormat: AppFormat;

  /** 应用根目录 */
  rootPath: string;

  /** 构建完成后复制安装包的原生工程目录 */
  nativeRoot?: string;

  /** 应用名称 */
  appName: string;

  /** 原生项目名称 */
  nativeProjectName: string;

  /** AppKey */
  appKey: string;

  // ==================== 构建选项 ====================
  /** 是否加密 */
  isSec: boolean;

  /** 是否启用 dsym */
  enableDsym: boolean;

  /** 是否 iOS 模拟器 */
  iosSimulator: boolean;

  /** 是否输出详细日志 */
  verbose: boolean;

  /** 是否跳过打包 */
  skip: boolean;

  /** 是否应该发布热更新 */
  shouldFirstCodePush = true;

  /** 私钥 */
  privateKey: string;

  /** 是否使用本地 Bundle 配置 */
  useLocalBundleConfig = true;

  /** 是否拆包 */
  unpacking: boolean;

  /** 是否启用 Hermes 编译 */
  hermes = true;

  // ==================== 管理器 ====================
  /** 配置管理器 */
  private configManager: ConfigManager;

  /** 版本管理器 */
  private versionManager: VersionManager;

  /** 依赖管理器 */
  private dependencyManager: DependencyManager;

  /** 基线管理器 */
  baselineManager: BaselineManager;

  // ==================== 其他数据 ====================
  /** Meta 配置 */
  meta: MetaConfig;

  /**
   * 初始化构建上下文
   */
  async init(
    project: string,
    platform: Platform,
    version: string,
    env: BuildEnv,
    options: BuildCommandOptions
  ): Promise<BuildJobContext> {
    logger.info("初始化构建参数: " + JSON.stringify(options, null, 2));

    if (!options.channel) {
      throw new Error("必须传递 channel 参数");
    }

    // 初始化基本信息
    this.initBasicInfo(project, platform, env, options);

    // 初始化构建选项
    this.initBuildOptions(options);

    // 初始化管理器
    this.initManagers();

    // 加载配置
    await this.loadConfig(version, options);

    // 初始化基线管理器
    this.initBaselineManager();

    return this;
  }

  /**
   * 初始化基本信息
   */
  private initBasicInfo(
    project: string,
    platform: Platform,
    env: BuildEnv,
    options: BuildCommandOptions
  ): void {
    this.project = project || "xrn";
    this.platform = platform;
    this.buildEnv = env;
    this.syncTargetEnv = (options.syncTargetEnv as BuildEnv) || undefined;
    this.buildType = options.type;
    this.branchName = options.bundleBranch;
    this.channel = options.channel;
    this.channelList = this.channel.split(",");
    this.rootPath = path.join(process.cwd(), options.appPath);
    this.nativeRoot = options.nativeRoot
      ? path.resolve(process.cwd(), options.nativeRoot)
      : undefined;
    this.appName = `xt-app-${this.platform}`;
  }

  /**
   * 初始化构建选项
   */
  private initBuildOptions(options: BuildCommandOptions): void {
    this.hermes = (options.hermes || "true") === "true";
    this.isSec = options.sec === "true";
    this.enableDsym = options.dsym === "true";
    this.verbose = options.verbose === "true" || process.env.verbose === "true";
    this.skip = options.skip === "true";
    this.shouldFirstCodePush = options.shouldFirstCodePush === "true";
    this.privateKey = options.privateKey || "";

    // 确定 appFormat
    this.appFormat = ConfigManager.determineAppFormat(
      this.platform,
      this.buildEnv,
      this.channel,
      options.appFormat
    );

    // iOS 模拟器判断
    this.iosSimulator =
      options.iosSimulator === "true" ||
      (this.appFormat === AppFormat.app && this.platform === Platform.iOS);
  }

  /**
   * 初始化管理器
   */
  private initManagers(): void {
    this.configManager = new ConfigManager(
      this.rootPath,
      this.platform,
      this.branchName,
      this.buildEnv
    );
    this.dependencyManager = new DependencyManager(this.rootPath);

    // 版本管理器需要先加载配置后才能初始化
    // 这里先占位，在 loadConfig 中初始化
  }

  /**
   * 初始化基线管理器
   */
  private initBaselineManager(): void {
    this.baselineManager = BaselineManagerFactory.createOrGet({
      platform: this.platform,
      buildEnv: this.buildEnv,
      buildType: this.buildType,
      version: this.version,
    });
    this.baselineManager.cleanBaselineDir();
  }

  /**
   * 加载配置
   */
  private async loadConfig(version: string, options: BuildCommandOptions): Promise<void> {
    // 1. 加载 xrn.config.json
    this.configManager.loadConfig();
    this.useLocalBundleConfig = this.configManager.shouldUseLocalBundleConfig();
    this.unpacking = this.configManager.shouldUnpack();
    this.nativeProjectName = this.configManager.getAppName();

    // 2. 初始化版本管理器
    const baseVersion = this.configManager.getAppVersion();
    this.versionManager = new VersionManager(
      baseVersion,
      version,
      this.platform,
      this.buildEnv,
      this.buildType
    );

    // 3. 加载依赖信息
    await this.dependencyManager.loadDependencies();

    // 4. 初始化本地版本管理器
    this.versionManager.init(options.minSupportedVersion);

    // 5. 加载 AppKey
    this.appKey = this.configManager.getAppKey(
      this.platform,
      this.buildType,
      this.channel
    );

    // 6. 加载 Bundle 配置
    if (this.useLocalBundleConfig) {
      this.configManager.loadBundleConfig(options.bundles);
    } else {
      // TODO: 从远程获取 bundle 配置
      logger.warn("暂不支持从远程获取 bundle 配置");
    }
  }

  // ==================== Getters（委托给管理器） ====================

  /** 获取版本号 */
  get version(): string {
    return this.versionManager.getVersion();
  }

  /** 获取基准版本号 */
  get baseVersion(): string {
    return this.versionManager.getBaseVersion();
  }

  /** 获取版本号时间戳 */
  get versionNumber(): string {
    return this.versionManager.getVersionNumber();
  }

  /** 获取版本号时间戳（兼容性方法） */
  getVersionNumber(): string {
    return this.versionNumber;
  }

  /** 获取最小支持版本 */
  get minSupportedVersion(): string {
    return this.versionManager.getMinSupportedVersion();
  }

  /** 是否强制更新 */
  get forceUpdate(): boolean {
    return this.versionManager.isForceUpdate();
  }

  /** 获取 package.json */
  get packageJson(): PackageJson {
    return this.dependencyManager.getPackageJson();
  }

  /** 获取已加载的 xrn.config.json */
  get xrnConfig(): ReturnType<ConfigManager["getConfig"]> {
    return this.configManager.getConfig();
  }

  /** 获取原生依赖 */
  get nativeDeps(): Record<string, DepInfo> {
    return this.dependencyManager.getNativeDeps();
  }

  /** 获取 react-native config 依赖 */
  get reactNativeConfigDeps(): Record<string, DepInfo> {
    return this.dependencyManager.getReactNativeConfigDeps();
  }

  /** 获取 core 版本 */
  get coreVersion(): string {
    return this.dependencyManager.getCoreVersion();
  }

  /** 获取当前 CLI 版本 */
  get cliVersion(): string {
    return require("../../package.json").version;
  }

  /** 获取 bundle 列表 */
  get subBundle(): Array<RepInfo> {
    return this.configManager.getSubBundles();
  }

  // ==================== 工具方法 ====================

  /**
   * 获取构建上下文报告
   */
  getBuildContextReport(): string {
    return [
      `project: ${this.project}`,
      `platform: ${this.platform}`,
      `version: ${this.version}`,
      `cliVersion: ${this.cliVersion}`,
      `buildEnv: ${this.buildEnv}`,
      `buildType: ${this.buildType}`,
      `branchName: ${this.branchName}`,
      `channel: ${this.channel}`,
      `appFormat: ${this.appFormat}`,
      `isSec: ${this.isSec}`,
      `enableDsym: ${this.enableDsym}`,
      `iosSimulator: ${this.iosSimulator}`,
      `verbose: ${this.verbose}`,
      `skip: ${this.skip}`,
      `hermes: ${this.hermes}`,
      `nativeProjectName: ${this.nativeProjectName}`,
      `rootPath: ${this.rootPath}`,
      `subBundle: ${this.configManager.getBundleNames()}`,
    ].join("\n");
  }

  /**
   * 获取标签（用于日志）
   */
  getTags(): Record<string, any> {
    return {
      project: this.project,
      appPlatform: this.platform,
      version: this.version,
      cliVersion: this.cliVersion,
      buildEnv: this.buildEnv,
      buildType: this.buildType,
      branchName: this.branchName,
      channel: this.channel,
      appFormat: this.appFormat,
      isSec: this.isSec,
      enableDsym: this.enableDsym,
      iosSimulator: this.iosSimulator,
      verbose: this.verbose,
      skip: this.skip,
      nativeProjectName: this.nativeProjectName,
      rootPath: this.rootPath,
      buildUrl: process.env.BUILD_URL,
    };
  }

  /**
   * 输出构建信息
   */
  logInfo(): void {
    logger.info("构建参数：\n" + this.getBuildContextReport());
  }
}

export const buildJobContext = new BuildJobContext();
