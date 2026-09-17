import inquirer from "inquirer";
import ora from "ora";
import semver from "semver";
import fs from "fs";
import path from "path";
import logger from "../../utlis/logger";
import { startAppContext } from "../StartAppContext";
import { AppInfo, DeviceType } from "../types";

const extensions: Record<DeviceType, string> = { [DeviceType.ANDROID]: ".apk", [DeviceType.IOS]: ".ipa", [DeviceType.IOS_SIMULATOR]: ".app", [DeviceType.HARMONY]: ".hap" };

const getArtifactRoots = (root: string, deviceType: DeviceType): string[] => {
  switch (deviceType) {
    case DeviceType.ANDROID:
      // Android 构建产物位于 flavors 对应的 Gradle outputs 子目录中。
      return [path.join(root, "android", "app", "build", "outputs", "apk")];
    case DeviceType.IOS:
    case DeviceType.IOS_SIMULATOR:
      // iOS 构建器分别输出到 iOS_Out_<buildType> 和
      // iOS_Out_<buildType>_simulator，实际包在 xcarchive 内。
      if (!fs.existsSync(root)) return [];
      return fs.readdirSync(root, { withFileTypes: true })
        .filter((entry) => entry.isDirectory() && entry.name.startsWith("iOS_Out_"))
        .filter((entry) => deviceType === DeviceType.IOS_SIMULATOR
          ? entry.name.endsWith("_simulator")
          : !entry.name.endsWith("_simulator"))
        .map((entry) => path.join(root, entry.name));
    case DeviceType.HARMONY:
      // Harmony 构建完成后会将重命名后的 hap/app 复制到原生工程根目录。
      return [root];
  }
};

const getVersion = (name: string, filePath: string, isDirectory: boolean): string | undefined => {
  const version = name.match(/^v([^_]+)/)?.[1];
  if (version || !isDirectory) return version;

  // 模拟器的 .app 保留原始 Scheme 名称；构建器同时在同目录生成带版本号的 zip。
  // 用该 zip 的名称补全版本，以支持 --app-version 和 core 版本筛选。
  const archive = fs.readdirSync(path.dirname(filePath), { withFileTypes: true })
    .find((entry) => entry.isFile() && entry.name.endsWith(".zip") && entry.name.startsWith("v"));
  return archive?.name.match(/^v([^_]+)/)?.[1];
};

const requestAppList = async (deviceType: DeviceType): Promise<AppInfo[]> => {
  const root = path.resolve(process.cwd(), startAppContext.args.nativeRoot || ".");
  const extension = extensions[deviceType];
  const apps: AppInfo[] = [];
  const visit = (directory: string) => {
    if (!fs.existsSync(directory)) return;
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const filePath = path.join(directory, entry.name);
      const isAppBundle = deviceType === DeviceType.IOS_SIMULATOR && entry.isDirectory() && entry.name.endsWith(extension);
      if ((entry.isFile() && entry.name.endsWith(extension)) || isAppBundle) {
        apps.push({ name: entry.name, version: getVersion(entry.name, filePath, entry.isDirectory()), filePath });
      } else if (entry.isDirectory()) {
        visit(filePath);
      }
    }
  };
  getArtifactRoots(root, deviceType).forEach(visit);
  return apps;
};

export const getAppList = async (type: DeviceType, coreVersion?: string): Promise<AppInfo[]> => {
  const spinner = ora("获取安装包").start();
  try {
    const appList = await requestAppList(type);
    spinner.succeed();
    const firstTwo = (v: string) => v.split(".").slice(0, 2).join(".");
    return appList.filter((app) => !coreVersion || (app.version && firstTwo(app.version) === firstTwo(coreVersion)))
      .sort((a, b) => semver.rcompare(semver.valid(a.version || "") || "0.0.0", semver.valid(b.version || "") || "0.0.0"));
  } catch (error) {
    spinner.fail();
    logger.error(error instanceof Error ? error.message : error);
    return [];
  }
};

export async function selectAppVersion(opts: { version?: string; appList: AppInfo[] }) {
  const { version, appList } = opts;
  if (startAppContext.args.verbose) logger.info(appList);
  if (!appList.length) throw new Error("未找到本地构建产物");
  if (version === "latest") return appList[0];
  if (version && version !== "select") {
    const app = appList.find((item) => item.version === version);
    if (app) return app;
    throw new Error("未找到指定版本");
  }
  if (appList.length === 1) return appList[0];
  const answer = await inquirer.prompt({ type: "list", name: "list", message: "Select an app version", choices: appList.map((app) => ({ name: app.name, value: app })), default: appList[0] });
  return answer.list as AppInfo;
}
