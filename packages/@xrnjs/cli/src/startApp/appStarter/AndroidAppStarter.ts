import path from "path";

import { AppStarter } from "./AppStarter";
import { getPlatformIdentifier } from "../../utlis/readAppJsonFile";
import { AndroidDeviceManager } from "../deviceManager/AndroidDeviceManager";
import { AppInfo, DeviceType } from "../types";
import { assertToolsInstalled } from "../utils/check";
import { getAppList, getLocalAppList } from "../utils/getVersionList";

/**
 * Android app starter implementation
 * Handles app installation and launching on Android devices and emulators
 * Extends the base AppStarter with Android-specific functionality
 */
export class AndroidAppStarter extends AppStarter {
  /**
   * Check if Android development tools are installed
   * Verifies that adb (Android Debug Bridge) is available
   */
  protected async checkTools() {
    await assertToolsInstalled(["adb"]);
  }
  
  /**
   * Create an Android device manager and start emulator if needed
   * Automatically starts an Android emulator if no devices are connected
   * @returns Promise resolving to an AndroidDeviceManager instance
   */
  protected async createDeviceManager() {
    // Start emulator logic if no devices are available
    if (!(await AndroidDeviceManager.getDevices())?.length) {
      const { EmulatorManager } = await import("../EmulatorManager");
      const emulatorInstance = await EmulatorManager.create();
      await emulatorInstance.start();
    }
    return await AndroidDeviceManager.create();
  }
  
  /**
   * Get the list of available remote Android app versions
   * @returns Promise resolving to an array of AppInfo objects
   */
  protected async getAppList() {
    return await getAppList(DeviceType.ANDROID, this.options.branch);
  }
  
  /**
   * Get the list of available local Android app versions
   * Searches in current directory and parent directory for Android apps
   * @returns Promise resolving to an array of AppInfo objects
   */
  protected async getLocalAppList() {
    return await getLocalAppList(DeviceType.ANDROID, [
      process.cwd(),
      path.join(process.cwd(), ".."),
    ]);
  }
  
  /**
   * Get the Android package name for the app
   * Prioritizes platform identifier, then app bundle ID, then command line option
   * @param app - App information
   * @returns The Android package name string
   */
  protected getPackageName(app: AppInfo) {
    return (
      getPlatformIdentifier(DeviceType.ANDROID, this.config) ||
      app.appBundleId ||
      this.options.packageName
    );
  }
  
  /**
   * Perform post-installation tasks for Android apps
   * Sets up port forwarding and launches the app automatically
   * @param deviceManager - Android device manager instance
   * @param app - App information
   */
  protected async postInstall(
    deviceManager: AndroidDeviceManager,
    app: AppInfo,
  ) {
    if (this.devServer) {
      await deviceManager.reversePort(this.devServer.port, this.devServer.port);
    }
    await deviceManager.launchApp(this.getPackageName(app));
  }
}
