// 定义参数的 TypeScript 类型接口

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

export interface AppInfo {
  /** App name */
  name: string;
  /** Download link for the app */
  link?: string;
  /** Local file path to the app */
  filePath?: string;
  /** App version string */
  version?: string;
}

export interface XrnOptions {
  appVersion?: string;
  port?: number;
  deviceType?: DeviceType;
  branch: string;
  newTab?: boolean;
  install?: "true" | "false";
  verbose?: boolean;
  packageName?: string;
  nativeRoot?: string;
  project?: string;
}

export interface XrnStartArgs extends StartBusinessArgs {
  /** Whether to use remote app versions */
  appVersion?: string;
  port?: number;
  deviceType?: DeviceType;
  branch?: string;
  newTab?: boolean;
  install?: "true" | "false";
  packageName?: string;
  nativeRoot?: string;
}

export interface FtpApp {
  name: string;
  link: string;
  version: string;
  appBundleId?: string;
}

export interface CommonResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
