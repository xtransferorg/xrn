import fsExtra from "fs-extra";
import path from "path";
import logger from "./logger";

export interface AppJson {
  name: string;
  displayName: string;
  skipCheckXtRnCoreVersion?: boolean;
  port?: number;
  useIndexTemplate?: boolean;
  useNativeSignature?: boolean;

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

export const getPlatformIdentifier = (
  platform: "android" | "ios" | "harmony",
  appJson: AppJson
) => {
  switch (platform) {
    case "android":
      return appJson.android?.packageName || "com.xrngo";
    case "ios":
      return appJson.ios?.bundleIdentifier || "com.xrngo";
    case "harmony":
      return appJson.harmony?.packageName || "com.xrngo";
    default:
      throw new Error(`Unsupported platform: ${platform as string}`);
  }
};
