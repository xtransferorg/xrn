import axios from "axios";
import fsExtra from "fs-extra";
import inquirer from "inquirer";
import moment from "moment";
import ora from "ora";
import path from "path";

import logger from "../../utlis/logger";
import { startAppContext } from "../StartAppContext";
import { CommonResponse, AppInfo, DeviceType } from "../types";

/**
 * Request app list from remote server
 * Fetches available app versions for a specific device type from the XRN server
 * 
 * @param deviceType - The target platform device type
 * @returns Promise resolving to array of AppInfo objects
 */
const requestAppList = async (deviceType: DeviceType) => {
  // TODO 插件化配置
  const baseUrl = `https://xrn.example.com/xrn-server/api`;
  const path = "/xrn-start/app-list";
  const res = await axios.post<
    CommonResponse<{
      appList: AppInfo[];
    }>
  >(`${baseUrl}${path}`, {
    startAppContext,
    platformFormat: deviceType,
  });

  if (startAppContext.args.verbose) {
    logger.info(res?.data || "请求异常");
  }

  if (!res?.data?.success) {
    logger.error(res?.data?.message || "请求异常");
    return [];
  }

  return res?.data?.data?.appList || [];
};

/**
 * Get local app list from specified directories
 * Scans directories for app files matching the device type and naming convention
 * Filters and sorts files by date/time and version
 * 
 * @param deviceType - The target platform device type
 * @param dirs - Array of directories to scan
 * @returns Promise resolving to array of AppInfo objects
 */
export const getLocalAppList = async (
  deviceType: DeviceType,
  dirs: string[],
): Promise<AppInfo[]> => {
  const files: {
    file: fsExtra.Dirent;
    dir: string;
    name: string;
    filePath: string;
  }[] = [];

  for (const dir of dirs) {
    if (!fsExtra.existsSync(dir)) {
      logger.error(`目录不存在: ${dir}`);
      continue;
    }
    if (!fsExtra.statSync(dir).isDirectory()) {
      logger.error(`路径不是目录: ${dir}`);
      continue;
    }
    // Read files in directory
    files.push(
      ...fsExtra.readdirSync(dir, { withFileTypes: true }).map((file) => ({
        name: file.name,
        file,
        dir,
        filePath: path.join(dir, file.name),
      })),
    );
  }
  return files
    .filter((it) => it.file.isFile())
    .filter((it) => {
      // Filter files by platform-specific extensions
      if (deviceType === DeviceType.IOS_SIMULATOR) {
        return it.name.endsWith(".zip");
      }
      if (deviceType === DeviceType.ANDROID) {
        return it.name.endsWith(".apk");
      }
      if (deviceType === DeviceType.IOS) {
        return it.name.endsWith(".ipa");
      }
      if (deviceType === DeviceType.HARMONY) {
        return it.name.endsWith(".hap");
      }
    })
    .filter((it) => {
      // Filter files by naming convention (date_time format)
      const arr = it.name.split("_");
      const dateReg = /\d{2}-\d{2}-\d{2}/;
      const timeReg = /\d{2}:\d{2}:\d{2}/;
      return arr[1] && arr[2] && dateReg.test(arr[1]) && timeReg.test(arr[2]);
    })
    .sort((a, b) => {
      // Sort by date/time, newest first
      return moment(`${a.name.split("_")[1]} ${a.name.split("_")[2]}`).isBefore(
        moment(`${b.name.split("_")[1]} ${b.name.split("_")[2]}`),
      )
        ? 1
        : -1;
    })
    .map((it) => ({
      name: it.name,
      filePath: it.filePath,
      version: it.name.split("_")[0].replace("v", ""),
    }))
    .filter((it, index, arr) => {
      // Keep only the latest version for each version number
      return arr.map((it) => it.version).indexOf(it.version) === index;
    })
    .sort((a, b) => {
      // Sort by version, newest first
      return -compareAppVersion(a.version, b.version);
    });
};

/**
 * Get app list from remote server or local files
 * Fetches app versions based on branch configuration
 * 
 * @param type - The target platform device type
 * @param branch - Git branch name for version filtering
 * @returns Promise resolving to array of AppInfo objects
 */
export const getAppList = async (type: DeviceType, branch) => {
  if (!branch) {
    const spinner = ora("获取安装包").start();
    try {
      const res = requestAppList(type);
      spinner.succeed();
      return res;
    } catch (error) {
      spinner.fail();
      logger.error(error?.message);
    }
  }
};

/**
 * Select an app version from the available list
 * Handles version selection logic including latest, specific version, or interactive selection
 * 
 * @param opts - Options for version selection
 * @param opts.version - Specific version to select (optional)
 * @param opts.appList - List of available app versions
 * @returns Promise resolving to selected AppInfo
 * @throws Error if no apps found or specified version not found
 */
export async function selectAppVersion(opts: {
  version?: string;
  appList: AppInfo[];
}) {
  const { version, appList } = opts;

  if (startAppContext.args.verbose) {
    logger.info(appList);
  }

  if (!appList.length) {
    console.error("未找到应用");
    throw new Error("未找到应用");
  }

  if (version === "latest") {
    return appList[0];
  }

  if (version && version !== "select") {
    const app = appList.find((app) => app.version === version);
    if (app) {
      return app;
    }
    throw new Error("未找到指定版本");
  }

  if (appList.length === 1) {
    return appList[0];
  }
  const app = await inquirer.prompt({
    type: "list",
    name: "list",
    message: "Select an app version",
    choices: appList.map((app) => ({
      name: app.name,
      value: app,
    })),
    default: appList[0],
  });
  return app.list as AppInfo;
}

/**
 * Compare two version numbers
 * Compares semantic version numbers and returns comparison result
 * 
 * @param version1 - First version string
 * @param version2 - Second version string
 * @returns 1 if version1 > version2, -1 if version1 < version2, 0 if equal
 */
export function compareAppVersion(version1: string, version2: string): number {
  const v1: number[] = version1.split(".").map((num) => parseInt(num, 10));
  const v2: number[] = version2.split(".").map((num) => parseInt(num, 10));

  for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
    const num1: number = v1[i] || 0;
    const num2: number = v2[i] || 0;

    if (num1 > num2) {
      return 1;
    } else if (num1 < num2) {
      return -1;
    }
  }
  return 0;
}
