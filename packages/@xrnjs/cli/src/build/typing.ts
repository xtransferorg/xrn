/**
 * TypeScript type definitions for the build system
 * Defines interfaces, enums, and types used throughout the build process
 */

/**
 * Repository information model for bundle management
 * Contains metadata about Git repositories and bundle configuration
 */
export interface RepInfo {
  /** Repository name */
  name: string;
  /** Git branch name */
  branchName: string;
  /** Git repository URL */
  gitUrl?: string;
  /** Type of bundle (main, sub, or example) */
  bundleType: BundleType;
  /** Resource paths for the bundle */
  resPath?: Array<string>;
  /** CodePush key for the bundle */
  codePushKey?: string;
  /** Whether to use common bundle */
  useCommonBundle?: boolean;
  /** Whether to check native dependencies */
  checkNativeDep?: boolean;
  /** Whether to write locale languages */
  writeLocaleLangs?: boolean;
  /** Relative path to bundle package */
  bundlePackageRelativePath?: string;
  /** Whether to enable caching */
  enableCache?: boolean;
  /** Command to run before bundle preparation */
  prepareCommand?: string;
}

/**
 * Job parameters for build execution
 * Contains all configuration needed for a build job
 */
export interface JobParams {
  /** Project name */
  project: string;
  /** Build environment */
  buildEnv: BuildEnv;
  /** Build type (debug or release) */
  buildType: BuildType;
  /** App version */
  version: string;
  /** Target platform */
  platform: Platform;
  /** Git branch name */
  branchName: string;
  /** Distribution channel */
  channel: string;
  /** App package format */
  appFormat: AppFormat;
  /** Sub-bundles configuration */
  subBundle: Array<RepInfo>;
  /** Whether to enable security features */
  isSec: boolean;
  /** Whether to enable debug symbols */
  enableDsym: boolean;
  /** Whether to build for iOS simulator */
  iosSimulator: boolean;
  /** Native project target name */
  nativeProjectName: string;
  /** Whether to enable verbose logging */
  verbose: boolean;
  /** Whether to skip build */
  skip: boolean;
}

/**
 * Bundle resource information
 * Contains paths for bundle and resources
 */
export interface BundleRes {
  /** Path to the bundle file */
  bundlePath: string;
  /** Path to resources */
  resPath: string;
}

/**
 * Supported platforms for building
 */
export enum Platform {
  iOS = "ios",
  Android = "android",
  Harmony = "harmony",
}

/**
 * Build environments
 */
export enum BuildEnv {
  dev = "dev", // Not used
  staging = "staging", // Not used
  prod = "prod", // Environment: hotupdate.xtransfer.com
  preProd = "pre-prod", // Environment: pre-cp.xtransfer.cn
}

/**
 * Build types
 */
export enum BuildType {
  DEBUG = "debug",
  RELEASE = "release",
}

/**
 * App package formats
 */
export enum AppFormat {
  apk = "apk",
  aab = "aab",
  ipa = "ipa",
  app = "app",
}

/**
 * Bundle types for different purposes
 */
export enum BundleType {
  main = "main", // Main bundle
  sub = "sub", // Sub bundle
  example = "example", // Example bundle
}

/**
 * XRN configuration type from xrn.config.json
 * Contains app configuration and update keys
 */
export interface XRNConfigType {
  /** Harmony OS update app key */
  harmonyUpdateAppKey: IOSUpdateAppKey;
  /** Whether to use local bundle configuration */
  useLocalBundleConfig: boolean;
  /** App name */
  appName: string;
  /** App version */
  appVersion: string;
  /** CLI version */
  cliVersion: string;
  /** Whether unpacking is enabled */
  unpacking: boolean;
  /** Bundle configuration */
  bundleConfig: BundleConfig;
  /** iOS update app key */
  iosUpdateAppKey?: IOSUpdateAppKey;
  /** Android update app key */
  androidUpdateAppKey?: AndroidUpdateAppKey;
}

/**
 * iOS update app key configuration
 */
export interface IOSUpdateAppKey {
  /** Debug build key */
  debug: string;
  /** Release build key */
  release: string;
}

/**
 * Android update app key configuration
 */
export interface AndroidUpdateAppKey {
  /** Debug build keys by channel */
  debug: ChannelAppKeyInfo;
  /** Release build keys by channel */
  release: ChannelAppKeyInfo;
}

/**
 * Channel-specific app key information
 */
export interface ChannelAppKeyInfo {
  /** China channel key */
  china: string;
  /** Default channel key */
  default: string;
}

/**
 * Bundle configuration structure
 */
export interface BundleConfig {
  /** Default options for all bundles */
  defaultOptions: DefaultOptions;
  /** Individual bundle configurations */
  bundles: BundleConfigItem[];
}

/**
 * Individual bundle configuration item
 */
export interface BundleConfigItem {
  /** Bundle name */
  name: string;
  /** Git repository URL */
  gitUrl?: string;
  /** Development server port */
  port: number;
  /** Bundle type */
  bundleType?: BundleType;
  /** Preparation command */
  prepareCommand?: string;
  /** Whether to use common bundle */
  useCommonBundle?: boolean;
  /** Whether to check native dependencies */
  checkNativeDep?: boolean;
  /** Whether to write locale languages */
  writeLocaleLangs?: boolean;
  /** Bundle package relative path */
  bundlePackageRelativePath?: string;
  /** Whether to enable caching */
  enableCache?: boolean;
}

/**
 * Default options for bundle configuration
 */
export interface DefaultOptions {
  /** Default bundle type */
  bundleType: BundleType;
  /** Default preparation command */
  prepareCommand?: string;
}

// Build script options

type Channel = "china";
type BooleanString = "false" | "true" | boolean;

/**
 * Build command options interface
 * Defines all available options for the build command
 */
export interface BuildCommandOptions {
  /** Build environment */
  env?: BuildEnv;
  /** Build type */
  type: BuildType;
  /** Bundle branch */
  bundleBranch: string;
  /** Distribution channel */
  channel: Channel;
  /** App format */
  appFormat: AppFormat;
  /** Security features flag */
  sec: BooleanString;
  /** Debug symbols flag */
  dsym: BooleanString;
  /** iOS simulator flag */
  iosSimulator: BooleanString;
  /** Verbose logging flag */
  verbose: BooleanString;
  /** Skip build flag */
  skip: BooleanString;
  /** Skip bundle flag */
  skipBundle: boolean;
  /** App path */
  appPath?: string;
  /** First CodePush flag */
  shouldFirstCodePush: BooleanString;
  /** Clean Watchman flag */
  cleanWatchMan: BooleanString;
  /** Private key path */
  privateKey: string;
}

/**
 * Redirected Harmony dependency information
 */
export interface RedirectedHarDep {
  /** Dependency name */
  name: string;
  /** Dependency version */
  version: string;
  /** Source directory */
  sourceDir: string;
  /** Whether to redirect internal imports */
  redirectInternalImports: boolean;
}

/**
 * Dependency information for native platforms
 */
export interface DepInfo {
  /** Dependency name */
  name: string;
  /** Dependency version */
  version: string;
  /** Dependency root path */
  root: string;
  /** Platform-specific configurations */
  platforms: {
    /** Android-specific configuration */
    android?: {
      sourceDir: string;
      [key: string]: any;
    };
    /** iOS-specific configuration */
    ios?: {
      sourceDir: string;
      [key: string]: any;
    };
    /** Harmony OS-specific configuration */
    harmony?: {
      sourceDir: string;
      alias?: string;
      [key: string]: any;
    };
  };
}
