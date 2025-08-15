import path from "path";

import { AppStarter } from "./AppStarter";
import logger from "../../utlis/logger";
import { getPlatformIdentifier } from "../../utlis/readAppJsonFile";
import { IOSDeviceManager } from "../deviceManager/IOSDeviceManager";
import { AppInfo, DeviceType } from "../types";
import { assertToolsInstalled } from "../utils/check";
import { getAppList, getLocalAppList } from "../utils/getVersionList";

/**
 * iOS device app starter implementation
 * Handles app installation and launching on physical iOS devices
 * Extends the base AppStarter with iOS-specific functionality
 */
export class IOSAppStarter extends AppStarter {
  /**
   * Check if iOS deployment tools are installed
   * Verifies that ios-deploy is available for device deployment
   */
  protected async checkTools() {
    await assertToolsInstalled(["ios-deploy"]);
  }
  
  /**
   * Create an iOS device manager for handling device operations
   * @returns Promise resolving to an IOSDeviceManager instance
   */
  protected async createDeviceManager() {
    return await IOSDeviceManager.create();
  }
  
  /**
   * Get the list of available remote iOS app versions
   * @returns Promise resolving to an array of AppInfo objects
   */
  protected async getAppList() {
    return await getAppList(DeviceType.IOS, this.options.branch);
  }

  /**
   * Get the list of available local iOS app versions
   * Searches in current directory and parent directory for iOS apps
   * @returns Promise resolving to an array of AppInfo objects
   */
  protected async getLocalAppList() {
    return await getLocalAppList(DeviceType.IOS, [
      process.cwd(),
      path.join(process.cwd(), ".."),
    ]);
  }

  /**
   * Get the iOS bundle identifier for the app
   * @param _app - App information (unused in this implementation)
   * @returns The iOS bundle identifier string
   */
  protected getPackageName(_app: AppInfo) {
    return getPlatformIdentifier(DeviceType.IOS, this.config);
  }
  
  /**
   * Perform post-installation tasks for iOS apps
   * iOS apps cannot be automatically launched, so we inform the user to launch manually
   * @param _deviceManager - Device manager instance (unused)
   * @param _app - App information (unused)
   */
  protected async postInstall(_deviceManager: any, _app: AppInfo) {
    logger.info("iOS App 无法自动打开，请手动打开");
  }
}
