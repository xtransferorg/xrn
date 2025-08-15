import fsExtra from "fs-extra";
import path from "path";

import logger from "./logger";

/**
 * Interface defining the structure of app.json configuration file
 * Contains app metadata and platform-specific configurations
 */
export interface AppJson {
  /** App name used for identification */
  name: string;
  /** Display name shown to users */
  displayName: string;
  /** Whether to skip XTRN core version checking */
  skipCheckXtRnCoreVersion?: boolean;
  /** Development server port number */
  port?: number;
  /** Whether to use index template */
  useIndexTemplate?: boolean;
  /** Android-specific configuration */
  android?: {
    /** Android package name */
    packageName?: string;
  };
  /** iOS-specific configuration */
  ios?: {
    /** iOS bundle identifier */
    bundleIdentifier?: string;
  };
  /** Harmony OS-specific configuration */
  harmony?: {
    /** Harmony package name */
    packageName?: string;
  };
}

/**
 * Read and parse app.json file from the specified project path
 * Loads app configuration and returns parsed AppJson object
 * 
 * @param projectPath - Path to the project directory containing app.json
 * @returns Promise resolving to AppJson configuration object
 * @throws Error and exits process if file cannot be read or parsed
 */
export const readAppJsonFile = async (projectPath: string) => {
  try {
    const fileContent = await fsExtra.readFile(
      path.join(projectPath, "app.json"),
      "utf-8"
    );
    const appJson = JSON.parse(fileContent);
    return appJson as AppJson;
  } catch (error) {
    logger.error(`读取${projectPath}文件失败，请检查文件是否存在！`);
    process.exit(1);
  }
};

/**
 * Get platform-specific identifier from app.json configuration
 * Returns the appropriate package name or bundle identifier for the specified platform
 * 
 * @param platform - Target platform (android, ios, or harmony)
 * @param appJson - AppJson configuration object
 * @returns Platform-specific identifier string or undefined if not configured
 * @throws Error if platform is not supported
 */
export const getPlatformIdentifier = (
  platform: "android" | "ios" | "harmony",
  appJson: AppJson
) => {
  switch (platform) {
    case "android":
      return appJson.android?.packageName;
    case "ios":
      return appJson.ios?.bundleIdentifier;
    case "harmony":
      return appJson.harmony?.packageName;
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
};
