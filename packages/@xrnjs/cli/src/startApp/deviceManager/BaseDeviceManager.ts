export abstract class BaseDeviceManager {
  deviceName: string;

  constructor(deviceName: string) {
    this.deviceName = deviceName;
  }

  // 检查设备是否在运行
  abstract isDeviceRunning(): Promise<boolean>;

  // 检查设备中是否安装了指定的应用
  abstract isAppInstalled(packageName: string): Promise<boolean>;

  // 获取应用版本
  abstract getAppVersion(packageName: string): Promise<string>;

  // 卸载应用
  abstract uninstallApp(packageName: string): Promise<void>;

  // 安装应用
  abstract installApp(appPath: string): Promise<void>;

  // 启动应用
  abstract launchApp(packageName: string, activity?: string): Promise<void>;

  // 端口反向代理（如有需要）
  abstract reversePort?(devicePort: number, port: number): Promise<void>;
  abstract removeReversePort?(devicePort: number): Promise<void>;
}
