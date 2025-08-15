// TypeScript type definitions for the startApp module

import { StartBusinessArgs } from "../build/bundle/startBusinessBundle";

/**
 * Supported device types for app deployment
 */
export enum DeviceType {
  ANDROID = "android",
  IOS = "ios",
  IOS_SIMULATOR = "ios-simulator",
  HARMONY = "harmony",
}

/**
 * Configuration options for XRN app operations
 */
export interface XrnOptions {
  /** Specific app version to install */
  appVersion?: string;
  /** Development server port */
  port?: number;
  /** Target device type */
  deviceType?: DeviceType;
  /** Git branch name for app version selection */
  branch: string;
  /** Whether to open in new tab */
  newTab?: boolean;
  /** Whether to install the app */
  install?: "true" | "false";
  /** Enable verbose logging */
  verbose?: boolean;
  /** App package name/bundle identifier */
  packageName?: string;
  /** Project name */
  project?: string;
}

/**
 * Extended start arguments including remote deployment options
 */
export interface XrnStartArgs extends StartBusinessArgs {
  /** Whether to use remote app versions */
  remote?: boolean;
  /** Specific app version to install */
  appVersion?: string;
  /** Development server port */
  port?: number;
  /** Target device type */
  deviceType?: DeviceType;
  /** Git branch name for app version selection */
  branch?: string;
  /** Whether to open in new tab */
  newTab?: boolean;
  /** Whether to install the app */
  install?: "true" | "false";
  /** App package name/bundle identifier */
  packageName?: string;
}

/**
 * Information about an app version
 */
export interface AppInfo {
  /** App name */
  name: string;
  /** Download link for the app */
  link?: string;
  /** Local file path to the app */
  filePath?: string;
  /** App version string */
  version?: string;
  /** App bundle identifier/package name */
  appBundleId?: string;
}

/**
 * Standard response format for API calls
 */
export interface CommonResponse<T> {
  /** Whether the operation was successful */
  success: boolean;
  /** Response message */
  message: string;
  /** Response data */
  data: T;
}
