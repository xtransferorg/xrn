import { CheckSysIntegrityResult } from "../NativeXRNAppUtilsModule";

export type AppUtilsStatic = {
  /**
   * 系统是否已Root
   * @returns
   */
  isAppRooted: () => Promise<boolean>;
  /**
   * 检查设备安全性
   * @param nonce 服务端生成的随机数
   * @returns
   */
  checkSysIntegrity: (nonce: string) => Promise<CheckSysIntegrityResult>;
  /**
   * 安装App
   * @param filePath 安装包路径
   * @returns
   */
  installApp: (filePath: string) => void;
  /**
   * 特定包是否已安装
   * @returns App包名
   */
  isAppInstalled: (pkgName: string) => boolean;
  /**
   * 退出App
   * @returns
   */
  exitApp: () => void;
  /**
   * 重启App
   * @returns
   */
  relaunchApp: () => void;
  /**
   * 重启或退出App
   * @returns
   */
  relaunchOrExit: () => void;
  /**
   * App切到后台
   * @returns
   */
  moveTaskToBack: () => void;
  /**
   * Android/Harmony：打开指定应用市场的 App 详情页
   * @param appPkgName Android App 包名；Harmony App bundleName
   * @param marketPkgName 应用市场包名
   */
  launchAppDetail: (appPkgName: string, marketPkgName: string) => Promise<void>;
};

/**
 * LONG: 显示5s
 * SHORT： 显示3s
 */
// export type DurationMode = "LONG" | "SHORT";
export enum DurationMode {
  LONG = "LONG",
  SHORT = "SHORT",
}
/**
 * native Toast 弹框功能
 */
export type NativeToastStatic = {
  /**
   * 显示native toast
   * @param message 提示文案
   * @param duration 显示时长, 默认duration 为SHORT
   */
  showToast(message: string, duration?: DurationMode): Promise<boolean>;

  /**
   * 移除native toast
   */
  hideToast(): Promise<boolean>;
};
