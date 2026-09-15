import path from "path";
import { PackageJson } from "../../build/utils/package";
import logger from "../../utlis/logger";
import { AppJson } from "../../utlis/readAppJsonFile";
import { DevServer } from "../devServer";
import { BaseDeviceManager } from "../deviceManager/BaseDeviceManager";
import { XrnStartArgs, AppInfo, DeviceType } from "../types";
import { download } from "../utils/download";
import { getAppList, selectAppVersion } from "../utils/getAppList";

/**
 * Abstract base class for platform-specific app starters
 * Provides a common interface and workflow for starting apps on different platforms
 * Implements the template method pattern for platform-specific implementations
 */
export abstract class AppStarter {
  protected deviceType: DeviceType;
  protected options: XrnStartArgs;
  protected devServer: DevServer | null = null;
  protected config: AppJson;

  constructor(deviceType: DeviceType, options: XrnStartArgs, devServer: DevServer, config: AppJson) {
    this.deviceType = deviceType;
    this.options = options;
    this.devServer = devServer;
    this.config = config;
  }

  /**
   * Main entry point for starting an app
   * Implements the complete workflow: check tools, create device manager, prepare app, install/update, and post-install
   */
  async start() {
    await this.checkTools();
    const deviceManager = await this.createDeviceManager();
    const { app } = await this.prepareApp();
    if(app) {
      await this.installOrUpdateApp(deviceManager, app);
    }
    await this.postInstall(deviceManager);
  }

  /**
   * Abstract method to check if required platform tools are installed
   * Must be implemented by each platform-specific starter
   */
  protected abstract checkTools(): Promise<void>;

  /**
   * Abstract method to create a platform-specific device manager
   * Must be implemented by each platform-specific starter
   */
  protected abstract createDeviceManager(): Promise<BaseDeviceManager>;

  /**
   * Abstract method to get the package name/bundle identifier for an app
   * Must be implemented by each platform-specific starter
   */
  protected abstract getPackageName(): string;

  /**
   * Abstract method to perform post-installation tasks
   * Must be implemented by each platform-specific starter
   */
  protected abstract postInstall(
    deviceManager: BaseDeviceManager
  ): Promise<void>;

  /**
   * Prepare the app for installation by selecting the appropriate version
   * Handles both remote and local app version selection
   *
   * @returns Object containing the selected app information
   */
  protected async prepareApp() {
    const nodeModulesPath = path.join(process.cwd(), "node_modules");
    const corePackageJsonPath = path.join(nodeModulesPath, "@xrnjs/core", "package.json");
    let coreVersion: string | undefined;
    try {
      const corePackageJson = require(corePackageJsonPath) as PackageJson;
      coreVersion = corePackageJson.version;
    } catch (error) {
      logger.error(`获取 core 版本失败: ${error}`);
    }
    const appList = await getAppList(this.deviceType, coreVersion);
    const app: AppInfo = await selectAppVersion({
      version: this.options.appVersion,
      appList,
    });
    return { app };
  }

  /**
   * Install or update the app on the device
   * Checks if app is already installed and handles installation accordingly
   *
   * @param deviceManager - Platform-specific device manager
   * @param app - App information
   */
  protected async installOrUpdateApp(
    deviceManager: BaseDeviceManager,
    app: AppInfo
  ) {
    const packageName = this.getPackageName();
    if (await deviceManager.isAppInstalled(packageName)) {
      logger.info("当前应用已安装");
    } else {
      const filePath = app.filePath || (await download(app.link));
      await deviceManager.installApp(filePath);
    }
  }
}
