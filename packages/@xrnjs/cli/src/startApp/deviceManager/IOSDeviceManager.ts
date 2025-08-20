import inquirer from "inquirer";

import logger from "../../utlis/logger";
import { execAsync, execWithOra } from "../utils";
import { BaseDeviceManager } from "./BaseDeviceManager";

interface Device {
  deviceName: string;
  udid: string;
}

export class IOSDeviceManager extends BaseDeviceManager {
  device: Device;
  constructor(device: Device) {
    super(device.deviceName);
    this.device = device;
  }

  static async create(): Promise<IOSDeviceManager> {
    const devices = await IOSDeviceManager.getDevices();
    if (devices.length === 0) {
      throw new Error("未找到设备");
    }
    const device = await IOSDeviceManager.selectDevice(devices);
    return new IOSDeviceManager(device);
  }

  private static async selectDevice(devices: Device[]): Promise<Device> {
    if (devices.length > 1) {
      const answer = await inquirer.prompt({
        type: "list",
        name: "list",
        message: "Select an iOS device",
        choices: devices.map((device) => ({
          name: device.deviceName,
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
      const devices = await IOSDeviceManager.getDevices();
      return devices.some((device) => device.udid === this.device.udid);
    } catch (error) {
      logger.error(`执行命令时出错: ${(error as Error).message}`);
      return false;
    }
  }
  static async getDevices(): Promise<Device[]> {
    const { stdout } = await execAsync("ios-deploy --detect --timeout 1");
    const devices = stdout
      .split("\n")
      .filter((line) => line.includes("Found"))
      .map((line) => {
        const parts = line.split(" ");
        const matches = line.match(/'(.+)'/);
        return {
          deviceName: matches?.[1] || parts[2],
          udid: parts[2],
        } as Device;
      });
    return devices;
  }
  async isAppInstalled(packageName: string): Promise<boolean> {
    if (!(await this.isDeviceRunning())) {
      throw new Error(`设备 ${this.device.deviceName} 未运行`);
    }
    try {
      const packages = await this.getPackages();
      const isInstalled = packages.includes(packageName);
      logger.info(`应用${isInstalled ? "已" : "未"}安装`);
      return isInstalled;
    } catch (error) {
      logger.error(`执行命令时出错: ${(error as Error).message}`);
      return false;
    }
  }
  async getAppVersion(packageName: string): Promise<string> {
    // iOS 真机获取 app 版本一般需要特殊命令，这里暂时返回空字符串
    return "";
  }
  async uninstallApp(packageName: string): Promise<void> {
    // TODO: 需要实现卸载命令
  }
  async installApp(appPath: string): Promise<void> {
    if (!(await this.isDeviceRunning())) {
      throw new Error(`设备 ${this.device.deviceName} 未运行`);
    }
    await execWithOra("安装应用", `ios-deploy --bundle ${appPath}`);
  }
  async launchApp(packageName: string, activity?: string): Promise<void> {
    if (!(await this.isDeviceRunning())) {
      throw new Error(`设备 ${this.device.deviceName} 未运行`);
    }
    const command = `ios-deploy --id ${this.device.udid} --justlaunch --bundle_id ${packageName}`;
    await execWithOra("启动应用", command);
  }
  async reversePort(devicePort: number, port: number): Promise<void> {
    // iOS 真机一般不支持端口反向代理
  }
  async removeReversePort(devicePort: number): Promise<void> {
    // iOS 真机一般不支持端口反向代理
  }
  private async getPackages() {
    const { stdout } = await execAsync(
      `ios-deploy --id ${this.device.udid} --list_bundle_id`,
    );
    const packages = stdout.split("\n").filter((line) => line.trim() !== "");
    return packages;
  }
}
