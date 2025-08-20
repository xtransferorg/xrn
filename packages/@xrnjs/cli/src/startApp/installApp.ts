import { AndroidDeviceManager } from "./deviceManager/AndroidDeviceManager";
import { HarmonyDeviceManager } from "./deviceManager/HarmonyDeviceManager";
import { IOSDeviceManager } from "./deviceManager/IOSDeviceManager";
import { IOSSimulatorDeviceManager } from "./deviceManager/IOSSimulatorDeviceManager";
import { AppInfo, DeviceType, XrnOptions } from "./types";
import { assertToolsInstalled } from "./utils/check";
import { download } from "./utils/download";
import { getAppList, selectAppVersion } from "./utils/getVersionList";
import logger from "../utlis/logger";

/**
 * Install an app on the specified device type
 * This function handles the complete installation process including:
 * - Tool verification
 * - App version selection
 * - Download and installation
 * 
 * @param deviceType - The target platform device type
 * @param options - Installation configuration options
 */
export async function installApp(deviceType: DeviceType, options: XrnOptions) {
  if (deviceType === DeviceType.ANDROID) {
    // Android installation process
    await assertToolsInstalled(["adb"]);
    const deviceManager = await AndroidDeviceManager.create();
    const appList = await getAppList(deviceType, options.branch);
    if (!appList.length) {
      throw new Error("未找到可用版本");
    }

    const app: AppInfo = await selectAppVersion({
      version: options.appVersion,
      appList,
    });

    const packageName = app.appBundleId || options.packageName;
    const filePath = await download(app.link);

    // Uninstall existing app if already installed
    if (await deviceManager.isAppInstalled(packageName)) {
      await deviceManager.uninstallApp(packageName);
    }

    await deviceManager.installApp(filePath);
    logger.info("Android App 安装完成");
  } else if (deviceType === DeviceType.IOS) {
    // iOS device installation process
    await assertToolsInstalled(["ios-deploy"]);
    const deviceManager = await IOSDeviceManager.create();

    const appList = await getAppList(deviceType, options.branch);
    const app = await selectAppVersion({
      version: options.appVersion,
      appList,
    });

    const filePath = await download(app.link);
    await deviceManager.installApp(filePath);
    logger.info("iOS App 安装完成");
  } else if (deviceType === DeviceType.IOS_SIMULATOR) {
    // iOS simulator installation process
    await assertToolsInstalled(["xcrun"]);
    const deviceManager = await IOSSimulatorDeviceManager.create();

    const appList = await getAppList(deviceType, options.branch);
    const app = await selectAppVersion({
      version: options.appVersion,
      appList,
    });

    const zipFilePath = await download(app.link);
    const appPath = await IOSSimulatorDeviceManager.unzipApp(zipFilePath);
    await deviceManager.installApp(appPath);
    logger.info("iOS 模拟器 App 安装完成");
  } else if (deviceType === DeviceType.HARMONY) {
    // Harmony OS installation process
    await assertToolsInstalled(["hdc"]);
    const deviceManager = await HarmonyDeviceManager.create();

    const appList = await getAppList(deviceType, options.branch);
    const app: AppInfo = await selectAppVersion({
      version: options.appVersion,
      appList,
    });

    const filePath = await download(app.link);

    await deviceManager.installApp(filePath);
    logger.info("鸿蒙 App 安装完成");
  } else {
    throw new Error("不支持的平台类型: " + deviceType);
  }
}
