

import { AppStarter } from "./AppStarter";
import logger from "../../utlis/logger";
import { getPlatformIdentifier } from "../../utlis/readAppJsonFile";
import { IOSDeviceManager } from "../deviceManager/IOSDeviceManager";
import { DeviceType } from "../types";
import { assertToolsInstalled } from "../utils/check";

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
   * Get the iOS bundle identifier for the app
   * @returns The iOS bundle identifier string
   */
  protected getPackageName() {
    return getPlatformIdentifier(DeviceType.IOS, this.config);
  }
  
  /**
   * Perform post-installation tasks for iOS apps
   * iOS apps cannot be automatically launched, so we inform the user to launch manually
   * @param _deviceManager - Device manager instance (unused)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected async postInstall(_deviceManager: any) {
    logger.info("iOS App 无法自动打开，请手动打开");
    return Promise.resolve();
  }
}
