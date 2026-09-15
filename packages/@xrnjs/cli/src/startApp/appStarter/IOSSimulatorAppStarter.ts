
import { AppStarter } from "./AppStarter";
import logger from "../../utlis/logger";
import { IOSSimulatorDeviceManager } from "../deviceManager/IOSSimulatorDeviceManager";
import { AppInfo, DeviceType } from "../types";
import { assertToolsInstalled } from "../utils/check";
import { download } from "../utils/download";
import { getPlatformIdentifier } from "../../utlis/readAppJsonFile";

/**
 * iOS Simulator app starter implementation
 * Handles app installation and launching on iOS Simulator
 * Extends the base AppStarter with iOS Simulator-specific functionality
 */
export class IOSSimulatorAppStarter extends AppStarter {
  /**
   * Check if iOS development tools are installed
   * Verifies that xcrun is available for iOS Simulator operations
   */
  protected async checkTools() {
    await assertToolsInstalled(["xcrun"]);
  }
  
  /**
   * Create an iOS Simulator device manager for handling simulator operations
   * @returns Promise resolving to an IOSSimulatorDeviceManager instance
   */
  protected async createDeviceManager() {
    return await IOSSimulatorDeviceManager.create();
  }
  
   /**
   * Get the iOS bundle identifier for the app
   * @returns The iOS bundle identifier string
   */
    protected getPackageName() {
      return getPlatformIdentifier(DeviceType.IOS, this.config);
    }
  
  /**
   * Perform post-installation tasks for iOS Simulator apps
   * Launches the app in the simulator and informs user to check the simulator
   * @param deviceManager - iOS Simulator device manager instance
   */
  protected async postInstall(deviceManager: any) {
    await deviceManager.launchApp(this.getPackageName());
    logger.info("应用已启动，请前往 iOS 模拟器查看");
  }
  
  /**
   * Override the base installOrUpdateApp method for iOS Simulator specific handling
   * Handles app installation with unzipping for iOS Simulator apps
   * @param deviceManager - iOS Simulator device manager instance
   */
  protected async installOrUpdateApp(
    deviceManager: IOSSimulatorDeviceManager,
    app: AppInfo,
  ) {
    const packageName = this.getPackageName();
    if (await deviceManager.isAppInstalled(packageName)) {
      logger.info("当前应用已安装");
    } else {
      const zipFilePath = app.filePath || (await download(app.link));
      const appPath = await IOSSimulatorDeviceManager.unzipApp(zipFilePath);
      await deviceManager.installApp(appPath);
    }
  }
}
