import path from "path";
import logger from "../utlis/logger";
import {
  AppFormat,
  BuildEnv,
  BuildCommandOptions,
  BuildType,
  BundleType,
  Platform,
  RepInfo,
  XRNConfigType,
  DefaultOptions,
  DepInfo,
} from "./typing";
import { isProd, padZero } from "./utils";
import {
  getAllNativeDeps,
  PackageJson,
  readPackageJsonSync,
} from "./utils/package";
import { MetaConfig } from "./bundle/interface";
import { DEPENDENCIES_CHECK_WHITELIST } from "./constants";

export class BuildJobContext {
  /** XTransfer */
  project: string;

  /** ios/android */
  platform: Platform;

  /** 如：3.3.2，默认从xrn.config.json中获取 */
  version: string;

  /** 环境 */
  buildEnv: BuildEnv;

  /** debug/release */
  buildType: BuildType;

  /** feat-1030-stable */
  branchName: string;

  /** android 渠道包。googlePlay：国际版。china：大陆版（xt.app）。chinaNew：大陆版（xt.app.xtransfer）。xiaomi：小米。vivo：vivio。huawei：华为。oppo：oppo。honor：honor。*/
  channel: string;

  /** Android app 包类型。apk/aab */
  appFormat: AppFormat;

  /** 是否加密 */
  isSec: boolean;

  /** 是否启用dsym，默认false */
  enableDsym: boolean;

  /** 是否ios模拟器 */
  iosSimulator: boolean;

  /** 是否输出log */
  verbose: boolean;

  /** 是否清理 watchman */
  cleanWatchMan: boolean;

  /** 是否跳过打包 */
  skip: boolean;

  /** 如：xtapp，项目名称，从xrn.config.json中获取 */
  nativeProjectName: string;

  /** bundle 列表 */
  subBundle: Array<RepInfo>;

  /** app 根目录 */
  rootPath: string;

  /** 是否使用本地配置 */
  useLocalBundleConfig = true;

  /** appKey */
  appKey: string;

  /** 版本号 */
  versionNumber: string;

  /** 拆包 */
  unpacking: boolean;

  /** 是否应该发布热更新，默认true */
  shouldFirstCodePush = true;

  /** 私钥 */
  privateKey: string;

  /** 原生配置 */
  // nativeConfig: Config;

  /** 原生 package.json */
  packageJson: PackageJson;

  /** 原生依赖信息 */
  nativeDeps: Record<string, DepInfo>;

  /** 是否跳过 bundle 打包 */
  skipBundle: boolean;

  meta?: MetaConfig

  async init(
    project: string,
    platform: Platform,
    options: BuildCommandOptions
  ) {
    this.project = project;
    this.platform = platform;
    this.buildEnv = options.env || BuildEnv.dev;
    this.buildType = options.type;
    this.branchName = options.bundleBranch;
    this.channel = options.channel;
    this.appFormat = options.appFormat;
    this.isSec = options.sec === "true";
    this.enableDsym = options.dsym === "true";
    this.iosSimulator =
      options.iosSimulator === "true" ||
      (this.appFormat === AppFormat.app && this.platform === Platform.iOS);
    this.verbose = options.verbose === "true" || process.env.verbose === "true";
    this.cleanWatchMan =options.cleanWatchMan === true ||  options.cleanWatchMan === "true";
    this.skip = options.skip === true || options.skip === "true";
    this.skipBundle = options.skipBundle === true || options.skip === "true";
    this.rootPath = path.join(process.cwd(), options.appPath);
    this.shouldFirstCodePush = options.shouldFirstCodePush === "true";
    this.privateKey = options.privateKey || "";
    await this.loadConfig();
    return this;
  }

  private calcVersionNumber() {
    const currentDate = new Date();
    const timestampShort = `${currentDate.getFullYear()}${padZero(
      currentDate.getMonth() + 1
    )}${padZero(currentDate.getDate())}`;

    if (this.platform === Platform.Android) {
      return timestampShort;
    } else if (this.platform === Platform.Harmony) {
      return `${timestampShort}0`;
    } else {
      const timestamp = `${timestampShort}${padZero(
        currentDate.getHours()
      )}${padZero(currentDate.getMinutes())}`;

      if (this.buildEnv === BuildEnv.prod) {
        return timestamp + "00";
      }

      return timestamp;
    }
  }

  loadVersionNumber() {
    this.versionNumber = this.calcVersionNumber();
  }

  getVersionNumber() {
    if (!this.versionNumber) {
      this.loadVersionNumber();
    }
    return this.versionNumber;
  }

  private loadAppKey(config: XRNConfigType) {
    if (this.platform === Platform.iOS) {
      this.appKey = config.iosUpdateAppKey[this.buildType];
    } else if (this.platform === Platform.Android) {
      const keyInfo = config.androidUpdateAppKey[this.buildType];
      this.appKey = keyInfo?.[this.channel] || keyInfo?.default;
    } else if (this.platform === Platform.Harmony) {
      this.appKey = config.harmonyUpdateAppKey[this.buildType];
    }
    if (!this.appKey) {
      throw new Error("appKey 不存在，请检查 xrn.config.json 配置");
    }
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async loadConfig() {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const configJson = require(
      `${this.rootPath}/xrn.config.json`
    ) as XRNConfigType;

    this.useLocalBundleConfig = configJson.useLocalBundleConfig ?? true;
    this.unpacking = configJson.unpacking ?? true;

    // 如果外面传递了版本就用外部传递的版本，否则用配置文件中的版本
    this.version = this.version || configJson.appVersion;
    if (this.version.length <= 0) {
      throw new Error("版本号存在问题");
    }

    this.nativeProjectName = configJson.appName;
    this.project = this.project || this.nativeProjectName;

    if (this.useLocalBundleConfig) {
      const bundlesConfig = configJson.bundleConfig;
      const bundleArray = bundlesConfig.bundles;
      const bundleDefaultOptions: DefaultOptions = bundlesConfig.defaultOptions;

      this.subBundle = bundleArray.map((bundleInfo) => {
        let enableCache = bundleInfo.enableCache ?? true;
        // 生产环境不启用缓存
        if (isProd(this.buildEnv)) {
          enableCache = false;
        }

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
          writeLocaleLangs: bundleInfo.writeLocaleLangs ?? true,
          enableCache,
        };
      });
    } else {
      // TODO: 从远程获取 bundle 配置
    }

    this.loadAppKey(configJson);
    // this.nativeConfig = loadNativeConfig(this.rootPath);
    this.packageJson = readPackageJsonSync(this.rootPath);


    const { nativeDeps, duplicateDeps } = getAllNativeDeps(
      this.rootPath,
      [Platform.Android, Platform.iOS, Platform.Harmony],
      DEPENDENCIES_CHECK_WHITELIST[this.platform]
    );
    if (duplicateDeps.length > 0) {
      logger.warn(`原生仓库检测到重复依赖：${duplicateDeps.join(",")}`);
      // throw new Error(`检测到重复依赖：${duplicateDeps.join(",")}`);
    }
    this.nativeDeps = nativeDeps;
  }

  getBuildContextReport() {
    return [
      `project: ${this.project}`,
      `platform: ${this.platform}`,
      `version: ${this.version}`,
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
      `nativeProjectName: ${this.nativeProjectName}`,
      `rootPath: ${this.rootPath}`,
      `subBundle: ${this.subBundle.map((item) => item.name).join(", ")}`,
    ].join("\n");
  }

  getTags() {
    return {
      project: this.project,
      platform: this.platform,
      version: this.version,
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
    };
  }

  logInfo() {
    logger.debug("构建参数：\n" + this.getBuildContextReport());
  }
}

export const buildJobContext = new BuildJobContext();
