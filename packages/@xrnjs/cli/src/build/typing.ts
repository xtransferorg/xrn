// 仓库信息模型
export interface RepInfo {
  name: string;
  branchName: string;
  gitUrl?: string;
  bundleType: BundleType;
  resPath?: Array<string>;
  codePushKey?: string;
  useCommonBundle?: boolean;
  checkNativeDep?: boolean;
  bundlePackageRelativePath?: string;
  prepareCommand?: string;
}

export interface JobParams {
  project: string;
  buildEnv: BuildEnv;
  buildType: BuildType;
  version: string;
  platform: Platform;
  branchName: string;
  channel: string;
  appFormat: AppFormat;
  // projectName: string;
  // nativeResInfo: RepInfo;
  subBundle: Array<RepInfo>;
  isSec: boolean;
  enableDsym: boolean;
  iosSimulator: boolean;
  nativeProjectName: string; // native 工程的 target
  verbose: boolean;
  skip: boolean;
}

export interface BundleRes {
  bundlePath: string;
  resPath: string;
}

export enum Platform {
  iOS = "ios",
  Android = "android",
  Harmony = "harmony",
}

export enum BuildEnv {
  dev = "dev", // 没用
  staging = "staging", // 没用
  prod = "prod",
  preProd = "pre-prod",
}

export enum BuildType {
  DEBUG = "debug",
  RELEASE = "release",
}

export enum AppFormat {
  apk = "apk",
  aab = "aab",
  ipa = "ipa",
  app = "app",
  hap = "hap",
}

// bundle类型
export enum BundleType {
  main = "main", // 主 bundle
  sub = "sub", // 子 bundle
  example = "example", // 示例 bundle
}

export enum TimingTrackerStage {
  DIFF_REPO_FETCH = "基线仓库下载",

  // bundle 处理
  PROCESS_COMMON_BUNDLE = "处理 common bundle",
  //   REPO_FETCH = "仓库拉取",
  REPO_INITIALIZE = "仓库初始化，并行拉取仓库、安装依赖等",
  //   DEPENDENCY_INSTALL = "依赖安装",
  BUNDLE_BUILDING = "仓库打包",
  PROCESS_BUNDLE_RESULTS = "处理 bundle 产物",
  PROCESS_SUB_BUNDLES = "处理所有子 bundle",
  //   BUNDLE_PREPARE = "准备 bundle",

  // 原生打包
  ANDROID_BUILD = "安卓 app 打包",
  IOS_BUILD = "ios app 打包",
  HARMONY_BUILD = "鸿蒙 app 打包",
  APP_UPLOAD = "app 上传",
  REINFORCE_APP= "App 加固",

  // 上传第一次热更新
  FIRST_CODE_PUSH = "第一次热更新",

  TOTAL = "总耗时",
}

export interface CommonBundleConfig {
  excludeDependencies?: string[];
}

// xrn.config.json
export interface XRNConfigType {
  harmonyUpdateAppKey: IOSUpdateAppKey;
  useLocalBundleConfig: boolean;
  appName: string;
  appVersion: string;
  cliVersion: string;
  unpacking: boolean;
  bundleConfig: BundleConfig;
  iosUpdateAppKey?: IOSUpdateAppKey;
  androidUpdateAppKey?: AndroidUpdateAppKey;
  commonBundleConfig?: CommonBundleConfig;
  enableHermesCompiler?: boolean;
}

export interface IOSUpdateAppKey {
  debug: string;
  release: string;
}

export interface AndroidUpdateAppKey {
  debug: ChannelAppKeyInfo;
  release: ChannelAppKeyInfo;
}

export interface ChannelAppKeyInfo {
  china: string;
  default: string;
}

export interface BundleConfig {
  defaultOptions: DefaultOptions;
  bundles: BundleConfigItem[];
}

export interface BundleConfigItem {
  name: string;
  gitUrl?: string;
  port: number;
  bundleType?: BundleType;
  prepareCommand?: string;
  useCommonBundle?: boolean;
  checkNativeDep?: boolean;
  bundlePackageRelativePath?: string;
}

export interface DefaultOptions {
  bundleType: BundleType;
  prepareCommand?: string;
}

// build 脚本 options

type Channel = "china";
type BooleanString = "false" | "true";

export interface BuildCommandOptions {
  type: BuildType;
  /** 同步目标环境，通过 CLI 传参（dev / pre-prod / staging），默认空 */
  syncTargetEnv?: BuildEnv;
  bundleBranch: string;
  channel: Channel;
  appFormat: AppFormat;
  sec: BooleanString;
  dsym: BooleanString;
  iosSimulator: BooleanString;
  verbose: BooleanString;
  skip: BooleanString;
  appPath?: string;
  nativeRoot?: string;
  shouldFirstCodePush: BooleanString;
  privateKey: string;
  minSupportedVersion?: string;
  /** 用逗号分割的bundle名称列表，默认为all表示所有 */
  bundles?: string;
  /** 是否启用 Hermes 编译，传入字符串 true 或 false，默认 true */
  hermes?: BooleanString;
  /** 是否启用 deep-import Babel 插件，传入字符串 true 或 false，默认 true */
  enableDeepImport?: BooleanString;
}

export interface RedirectedHarDep {
  name: string;
  version: string;
  sourceDir: string;
  redirectInternalImports: boolean;
}

export interface DepInfo {
  name: string;
  version: string;
  root?: string;
  platforms: {
    android?: {
      sourceDir?: string;
      [key: string]: any;
    };
    ios?: {
      sourceDir?: string;
      [key: string]: any;
    };
    harmony?: {
      sourceDir?: string;
      alias?: string;
      [key: string]: any;
    };
  };
}
