import inquirer from "inquirer";

import logger from "../../utlis/logger";
import { startAppContext } from "../StartAppContext";
import { execAsync, execWithOra } from "../utils";
import { BaseDeviceManager } from "./BaseDeviceManager";

export class AndroidDeviceManager extends BaseDeviceManager {
  static async create() {
    const devices = await AndroidDeviceManager.getDevices();

    if (devices.length === 0) {
      throw new Error("未找到设备");
    }

    let device = devices[0];
    if (devices.length > 1) {
      const answer = await inquirer.prompt({
        type: "list",
        name: "list",
        message: "选择一个设备",
        choices: devices.map((device) => ({ name: device, value: device })),
        default: devices[0],
      });
      device = answer.list;
    }

    return new AndroidDeviceManager(device);
  }

  // 检查设备是否在运行
  async isDeviceRunning(): Promise<boolean> {
    try {
      const devices = await AndroidDeviceManager.getDevices();
      return devices.includes(this.deviceName);
    } catch (error) {
      logger.error(`执行命令时出错: ${(error as Error).message}`);
      return false;
    }
  }

  static async getDevices() {
    const { stdout } = await execAsync("adb devices");
    const devices = stdout
      .split("\n")
      .filter((line) => line.includes("\tdevice"))
      .map((line) => line.split("\t")[0]);
    return devices;
  }

  // 检查设备中是否安装了指定的应用
  async isAppInstalled(packageName: string): Promise<boolean> {
    if (!(await this.isDeviceRunning())) {
      throw new Error(`设备 ${this.deviceName} 未运行`);
    }

    try {
      const packages = await this.getPackages();
      const isInstalled = packages.some((pkg) => pkg.includes(packageName));
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
      `adb -s ${this.deviceName} shell dumpsys package ${packageName} | grep versionName`,
    );
    const version = stdout.split("=")[1].trim();

    if (startAppContext.args.verbose) {
      logger.info(stdout);
    }
    return version;
  }

  async uninstallApp(packageName: string): Promise<void> {
    if (!(await this.isDeviceRunning())) {
      throw new Error(`设备 ${this.deviceName} 未运行`);
    }

    // 检查应用是否已经安装
    // const isInstalled = await this.isAppInstalled(packageName);
    // if (!isInstalled) {
    //   return true;
    // }

    await execWithOra(
      "卸载应用",
      `adb -s ${this.deviceName} uninstall ${packageName}`,
    );
  }

  // 安装应用
  async installApp(apkPath: string): Promise<void> {
    if (!(await this.isDeviceRunning())) {
      throw new Error(`设备 ${this.deviceName} 未运行`);
    }

    // 检查应用是否已经安装
    // const isInstalled = await this.isAppInstalled(packageName);
    // if (isInstalled) {
    //   return true;
    // }

    await execWithOra(
      "安装应用",
      `adb -s ${this.deviceName} install ${apkPath}`,
    );
  }

  // 启动应用
  async launchApp(
    packageName: string,
    activity = "com.xtapp.MainActivity",
  ): Promise<void> {
    if (!(await this.isDeviceRunning())) {
      throw new Error(`设备 ${this.deviceName} 未运行`);
    }

    const command1 = `adb shell monkey -p ${packageName} -c android.intent.category.LAUNCHER 1`;
    let success = await execWithOra("启动应用", command1);
    if (!success) {
      logger.warn(`使用 monkey 命令启动应用失败, 尝试使用 am start 命令`);
      const command2 = `adb -s ${this.deviceName} shell am start -n ${packageName}/${activity} -a android.intent.action.MAIN`;
      success = await execWithOra("启动应用", command2);
    }
    if (success) {
      logger.info("应用启动成功，请前往设备查看");
    }
  }

  async reversePort(devicePort: number, port: number): Promise<void> {
    const cmd = `adb -s ${this.deviceName} reverse tcp:${devicePort} tcp:${port}`;

    if (startAppContext.args.verbose) {
      logger.info(cmd);
    }

    await execAsync(cmd);
  }

  async removeReversePort(devicePort: number): Promise<void> {
    const cmd = `adb -s ${this.deviceName} reverse --remove tcp:${devicePort}`;
    if (startAppContext.args.verbose) {
      logger.info(cmd);
    }
    await execAsync(cmd);
  }

  private async getPackages() {
    const { stdout } = await execAsync(
      `adb -s ${this.deviceName} shell pm list packages`,
    );
    const packages = stdout.split("\n");
    return packages;
  }
}
