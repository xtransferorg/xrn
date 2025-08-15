import { randomUUID } from "crypto";
import fs from "fs";
import inquirer from "inquirer";
import os from "os";
import path from "path";
import { Open } from "unzipper";

import logger from "../../utlis/logger";
import { execAsync, execWithOra } from "../utils";
import { BaseDeviceManager } from "./BaseDeviceManager";

interface Device {
  name: string;
  udid: string;
  state:
    | "Booted"
    | "Shutdown"
    | "Creating"
    | "Booting"
    | "Shutting Down"
    | "Deleting"
    | "Cloning"
    | "Restoring"
    | "Waiting For VM"
    | "Unknown";
}

export class IOSSimulatorDeviceManager extends BaseDeviceManager {
  udid: string;
  constructor(deviceName: string, udid: string) {
    super(deviceName);
    this.udid = udid;
  }
  static async create() {
    const devices = await IOSSimulatorDeviceManager.getDevices();
    if (devices.length === 0) {
      throw new Error("未找到设备");
    }
    const bootedDevices = devices.filter((device) => device.state === "Booted");
    let device = devices[0];
    if (!bootedDevices.length) {
      device = await IOSSimulatorDeviceManager.selectDevice(devices);
    } else {
      device = await IOSSimulatorDeviceManager.selectDevice(bootedDevices);
    }
    const manager = new IOSSimulatorDeviceManager(device.name, device.udid);
    if (device.state !== "Booted") {
      await manager.startDevice();
    }
    return manager;
  }
  private static async selectDevice(devices: Device[]) {
    if (devices.length > 1) {
      const answer = await inquirer.prompt({
        type: "list",
        name: "list",
        message: "Select an iOS simulator",
        choices: devices.map((device) => ({
          name: device.name,
          value: device,
        })),
        default: devices[0],
      });
      return answer.list;
    } else {
      return devices[0];
    }
  }
  async isDeviceRunning(): Promise<boolean> {
    try {
      const devices = await IOSSimulatorDeviceManager.getRunningDevices();
      return devices.some((device) => device.udid === this.udid);
    } catch (error) {
      logger.error(`执行命令时出错: ${(error as Error).message}`);
      return false;
    }
  }
  static async getDevices() {
    const { stdout } = await execAsync(
      "xcrun simctl list devices available --json",
    );
    const devices = JSON.parse(stdout).devices;

    const availableDevices: Device[] = [];
    for (const deviceType in devices) {
      for (const device of devices[deviceType]) {
        if (device.isAvailable) {
          availableDevices.push({
            name: device.name,
            udid: device.udid,
            state: device.state,
          });
        }
      }
    }

    return availableDevices;
  }
  static async listAllDevices() {
    const { stdout } = await execAsync("xcrun simctl list devices --json");
    const _devices = JSON.parse(stdout).devices;

    const devices: Device[] = [];
    for (const deviceType in _devices) {
      devices.push(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ..._devices[deviceType].map((device: any) => ({
          name: device.name,
          udid: device.udid,
          state: device.state,
        })),
      );
    }

    return devices;
  }
  static async getRunningDevices() {
    return (await this.listAllDevices()).filter(
      (device) => device.state === "Booted",
    );
  }
  async startDevice() {
    if (await this.isDeviceRunning()) {
      logger.info(`设备 ${this.deviceName} 已经在运行`);
      return;
    }

    try {
      logger.info(`启动模拟器: ${this.deviceName} (${this.udid})`);
      await execAsync(`xcrun simctl boot ${this.udid}`);
      await execAsync(
        `open -a Simulator --args -CurrentDeviceUDID ${this.udid}`,
      );
    } catch (error) {
      logger.error(`启动模拟器时出错: ${(error as Error).message}`);
    }
  }
  async isAppInstalled(packageName: string): Promise<boolean> {
    if (!(await this.isDeviceRunning())) {
      throw new Error(`设备 ${this.deviceName} 未运行`);
    }
    try {
      const { stdout } = await execAsync(
        `xcrun simctl listapps ${this.udid} --json`,
      );
      const isInstalled = stdout.includes(packageName);
      logger.info(`应用${isInstalled ? "已" : "未"}安装`);
      return isInstalled;
    } catch (error) {
      logger.error(`执行命令时出错: ${(error as Error).message}`);
      return false;
    }
  }
  async getAppVersion(packageName: string): Promise<string> {
    if (!(await this.isDeviceRunning())) {
      throw new Error(`设备 ${this.deviceName} 未运行`);
    }
    const { stdout } = await execAsync(
      `/usr/libexec/PlistBuddy -c "Print :CFBundleShortVersionString" "$(xcrun simctl get_app_container ${this.udid} ${packageName})/Info.plist"`,
    );
    logger.info("当前app版本：" + stdout);
    return stdout;
  }
  async uninstallApp(packageName: string): Promise<void> {
    // TODO: 需要实现卸载命令
  }
  async installApp(appPath: string): Promise<void> {
    if (!(await this.isDeviceRunning())) {
      await this.startDevice();
    }
    await execWithOra(
      "安装应用",
      `xcrun simctl install ${this.udid} ${appPath}`,
    );
  }
  async launchApp(packageName: string, activity?: string): Promise<void> {
    if (!(await this.isDeviceRunning())) {
      await this.startDevice();
    }
    const command = `xcrun simctl launch ${this.udid} ${packageName}`;
    await execWithOra("启动应用", command);
  }
  async reversePort(devicePort: number, port: number): Promise<void> {
    // iOS 模拟器一般不支持端口反向代理
  }
  async removeReversePort(devicePort: number): Promise<void> {
    // iOS 模拟器一般不支持端口反向代理
  }
  // 解压应用
  static async unzipApp(zipFilePath: string) {
    const appExtractDir = path.join(
      os.tmpdir(),
      "xrn-app-extract",
      randomUUID(),
    ); // 使用随机目录避免冲突
    // const appExtractDir = "./node_modules/.xt-app-extract"; // 解压路径

    if (fs.existsSync(appExtractDir)) {
      fs.rmSync(appExtractDir, { recursive: true, force: true });
    }
    const dir = await Open.file(zipFilePath);
    await dir.extract({ path: appExtractDir });

    const appName = fs
      .readdirSync(appExtractDir)
      .find((file) => file.endsWith(".app"));
    const appPath = `${appExtractDir}/${appName}`; //解压后的app路径
    return appPath;
  }
}
