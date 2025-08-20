import path from "path";

import { AppStarter } from "./AppStarter";
import { getPlatformIdentifier } from "../../utlis/readAppJsonFile";
import { HarmonyDeviceManager } from "../deviceManager/HarmonyDeviceManager";
import { AppInfo, DeviceType } from "../types";
import { assertToolsInstalled } from "../utils/check";
import { getAppList, getLocalAppList } from "../utils/getVersionList";

/**
 * Harmony OS app starter implementation
 * Handles app installation and launching on Harmony OS devices
 * Extends the base AppStarter with Harmony-specific functionality
 */
export class HarmonyAppStarter extends AppStarter {
  /**
   * Check if Harmony development tools are installed
   * Verifies that hdc (Harmony Device Connector) is available
   */
  protected async checkTools() {
    await assertToolsInstalled(["hdc"]);
  }
  
  /**
   * Create a Harmony device manager for handling device operations
   * @returns Promise resolving to a HarmonyDeviceManager instance
   */
  protected async createDeviceManager() {
    return await HarmonyDeviceManager.create();
  }
  
  /**
   * Get the list of available remote Harmony app versions
   * @returns Promise resolving to an array of AppInfo objects
   */
  protected async getAppList() {
    return await getAppList(DeviceType.HARMONY, this.options.branch);
  }

  /**
   * Get the list of available local Harmony app versions
   * Searches in current directory and parent directory for Harmony apps
   * @returns Promise resolving to an array of AppInfo objects
   */
  protected async getLocalAppList() {
    return await getLocalAppList(DeviceType.HARMONY, [
      process.cwd(),
      path.join(process.cwd(), ".."),
    ]);
  }

  /**
   * Get the Harmony package name for the app
   * Prioritizes platform identifier, then app bundle ID, then command line option
   * @param app - App information
   * @returns The Harmony package name string
   */
  protected getPackageName(app: AppInfo) {
    return (
      getPlatformIdentifier("harmony", this.config) ||
      app.appBundleId ||
      this.options.packageName
    );
  }
  
  /**
   * Perform post-installation tasks for Harmony apps
   * Sets up port forwarding and launches the app automatically
   * @param deviceManager - Harmony device manager instance
   * @param app - App information
   */
  protected async postInstall(
    deviceManager: HarmonyDeviceManager,
    app: AppInfo,
  ) {
    if (this.devServer) {
      await deviceManager.reversePort(this.devServer.port, this.devServer.port);
    }
    await deviceManager.launchApp(this.getPackageName(app));
  }
}
