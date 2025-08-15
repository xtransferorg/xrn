import inquirer from "inquirer";

import { BaseDeviceManager } from "./BaseDeviceManager";
import logger from "../../utlis/logger";
import { startAppContext } from "../StartAppContext";
import { execAsync, execWithOra } from "../utils";

export class HarmonyDeviceManager extends BaseDeviceManager {
  static async create(): Promise<HarmonyDeviceManager> {
    const devices = await HarmonyDeviceManager.getDevices();
    if (devices.length === 0) {
      throw new Error("未找到鸿蒙设备");
    }
    let device = devices[0];
    if (devices.length > 1) {
      const answer = await inquirer.prompt({
        type: "list",
        name: "list",
        message: "选择一个鸿蒙设备",
        choices: devices.map((device) => ({ name: device, value: device })),
        default: devices[0],
      });
      device = answer.list;
    }
    return new HarmonyDeviceManager(device);
  }

  static async getDevices(): Promise<string[]> {
    const { stdout } = await execAsync("hdc list targets");
    const devices = stdout
      .split("\n")
      .filter((line) => !line.includes("Empty"))
      .map((line) => line.split(" ")[0])
      .filter(Boolean);
    return devices;
  }

  async isDeviceRunning(): Promise<boolean> {
    try {
      const devices = await HarmonyDeviceManager.getDevices();
      return devices.includes(this.deviceName);
    } catch (error) {
      logger.error(`执行命令时出错: ${(error as Error).message}`);
      return false;
    }
  }

  async isAppInstalled(packageName: string): Promise<boolean> {
    if (!(await this.isDeviceRunning())) {
      throw new Error(`设备 ${this.deviceName} 未运行`);
    }
    try {
      const { stdout } = await execAsync(
        `hdc -t ${this.deviceName} shell bm dump -a`,
      );
      return stdout.includes(packageName);
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
      `hdc -t ${this.deviceName} shell bm dump -n ${packageName}`,
    );
    // 解析版本号，具体格式需要根据实际输出调整
    const versionMatch = stdout.match(/"versionName": "([^"]+)"/);
    return versionMatch ? versionMatch[1] : "";
  }

  async uninstallApp(packageName: string): Promise<void> {
    if (!(await this.isDeviceRunning())) {
      throw new Error(`设备 ${this.deviceName} 未运行`);
    }
    await execWithOra(
      "卸载应用",
      `hdc -t ${this.deviceName} shell bm uninstall -n ${packageName}`,
    );
  }

  async installApp(appPath: string): Promise<void> {
    if (!(await this.isDeviceRunning())) {
      throw new Error(`设备 ${this.deviceName} 未运行`);
    }
    await execWithOra(
      "安装应用",
      `hdc -t ${this.deviceName} install ${appPath}`,
    );
  }

  async launchApp(packageName: string, activity?: string): Promise<void> {
    if (!(await this.isDeviceRunning())) {
      throw new Error(`设备 ${this.deviceName} 未运行`);
    }
    const command = `hdc -t ${this.deviceName} shell aa start -a EntryAbility -b ${packageName}`;
    const success = await execWithOra("启动应用", command);
    if (success) {
      logger.info("应用启动成功，请前往设备查看");
    }
  }

  async reversePort(devicePort: number, port: number): Promise<void> {
    const cmd = `hdc -t ${this.deviceName} rport tcp:${devicePort} tcp:${port}`;
    if (startAppContext.args.verbose) {
      logger.info(cmd);
    }
    try {
      await execAsync(cmd);
    } catch (error) {
      if (startAppContext.args.verbose) {
        logger.warn(`执行命令时出错: ${(error as Error).message}`);
      }
    }
  }

  async removeReversePort(devicePort: number): Promise<void> {
    // 鸿蒙暂未实现端口反向代理移除，如有需要可补充
  }
}
