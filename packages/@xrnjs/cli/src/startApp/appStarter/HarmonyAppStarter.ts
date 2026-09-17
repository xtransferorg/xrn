import { AppStarter } from "./AppStarter";
import { getPlatformIdentifier } from "../../utlis/readAppJsonFile";
import { HarmonyDeviceManager } from "../deviceManager/HarmonyDeviceManager";
import { assertToolsInstalled } from "../utils/check";

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
   * Get the Harmony package name for the app
   * Prioritizes platform identifier, then app bundle ID, then command line option
   * @returns The Harmony package name string
   */
  protected getPackageName() {
    return (
      getPlatformIdentifier("harmony", this.config) ||
      this.options.packageName
    );
  }
  
  /**
   * Perform post-installation tasks for Harmony apps
   * Sets up port forwarding and launches the app automatically
   * @param deviceManager - Harmony device manager instance
   */
  protected async postInstall(
    deviceManager: HarmonyDeviceManager,
  ) {
    if (this.devServer) {
      await deviceManager.reversePort(this.devServer.port, this.devServer.port);
    }
    await deviceManager.launchApp(this.getPackageName());
  }
}
