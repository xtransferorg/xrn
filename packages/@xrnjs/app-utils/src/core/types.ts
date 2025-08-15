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
   * 跳转到应用市场的指定应用详情
   * @param appPkgName App包名；鸿蒙平台是AppId
   * @param marketPkgName 应用市场包名
   * @returns
   */
  launchAppDetail: (appPkgName: string, marketPkgName: string) => Promise<void>;
};

/**
 * 文件操作相关
 */
export type FileStatic = {
  /**
   * 清除 Fresco 缓存（Android图片加载库）
   */
  clearFrescoCache(): Promise<boolean>;

  /**
   * 插入本地图片到系统相册（目前仅用于 Android）
   * @param options 
   */
  insertImageToPhotoLibrary(options: ImageOptions): Promise<boolean>;
};

export type ImageOptions = {
  path: string;
  fileName?: string;
};

/**
 * LONG: 显示5s
 * SHORT： 显示3s
 */
export type DurationMode = "LONG" | "SHORT";

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
