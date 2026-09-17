import { TurboModuleRegistry } from "react-native";
import type { TurboModule } from "react-native/Libraries/TurboModule/RCTExport";

/**
 * bundle列表对象
 */
export type BundleList = {
  /**
   * bunldeName
   */
  bundleName: string;
  /**
   * 端口号
   */
  port: string;
};

/**
 * Bundle信息列表
 */
export type BundleInfoList = {
  /**
   * Bundle信息列表
   */
  bundleInfoList: BundleInfo[];
};

/**
 * Bundle信息
 */
export type BundleInfo = {
  /**
   * Bundle名
   */
  bundleName: string;
  /**
   * Bundle类型
   * main表示主bundle
   */
  bundleType: string;
  /**
   * Bundle对应的js文件名
   */
  bundleJSFileName: string;
  /**
   * Bundle本地服务url
   */
  bundleLocalServerUrl: string;
  /**
   * Bundle本地服务端口
   */
  bundleLocalServerPort: number;
  /**
   * 热更信息
   */
  codePushPackage: CodePushInfo;
  /**
   * bundle 类型
   * INNER: 内置
   * DYNAMIC: 动态下发
   */
  deliveryType?: string;
};

/**
 * 热更信息
 */
export type CodePushInfo = {
  /**
   * app版本
   */
  appVersion?: string;
  /**
   * 修改时间
   */
  binaryModifiedTime?: string;
  /**
   * bundle文件路径
   */
  bundlePath?: string;
  /**
   * codepushkey
   */
  deploymentKey?: string;
  /**
   * 描述
   */
  description?: string;
  /**
   * 下载url
   */
  downloadUrl?: string;
  /**
   * 是否热更安装失败
   */
  failedInstall?: boolean;
  /**
   * 是否强更
   */
  isMandatory?: boolean;
  /**
   * 是否待安装
   */
  isPending?: boolean;
  /**
   * 标签
   */
  label?: string;
  /**
   * hash值
   */
  packageHash?: string;
  /**
   * 热更包大小
   */
  packageSize?: number;
};

export type ReleaseAllBundleOptions = {
  /**
   * 排除释放的bundle列表
   */
  excludeBundles?: string[];
};

export interface Spec extends TurboModule {
  /**
   * 获取当前 Bundle 信息
   */
  getCurBundleInfo(): Promise<BundleInfo>;
  /**
   * 获取指定Bundle信息
   * @param bundleName Bundle名
   */
  getBundleInfo(bundleName: string): Promise<BundleInfo>;
  /**
   * 获取所有Bundle信息
   */
  getAllBundleInfos(): Promise<BundleInfoList>;

  /**
   * 获取native配置的bundle列表
   */
  getBundleList(): Promise<BundleList[]>;

  /**
   * 预加载指定 Bundle
   * @param bundleName Bundle名
   */
  preLoadBundle(bundleName: string): boolean;

  /**
   * 释放引用计数为 0 的bundle
   * @param bundleName
   */
  releaseBundle(bundleName: string): boolean;

  /**
   * 强制释放指定bundle
   * @param bundleName
   */
  releaseBundleForce(bundleName: string): boolean;

  /**
   * 释放所有可释放的bundle
   */
  releaseAllBundle(options?: ReleaseAllBundleOptions): boolean;

  /**
   * 重新加载指定 Bundle
   * @param bundleName Bundle名
   */
  reloadBundleByName(bundleName: string): boolean;

  /**
   * 强制重新加载指定 Bundle
   * @param bundleName Bundle名
   */
  reloadBundleForceByName(bundleName: string): boolean;

  /**
   * Common预加载 是否可用
   * @param enabled 默认：true
   */
  preloadCommonEnabled(enabled: boolean): boolean;

  /**
   * biz bundle预加载 是否可用
   * @param enabled 默认：true
   */
  preloadBundleEnabled(enabled: boolean): boolean;

  /**
   * 重新加载当前Bundle
   */
  reloadBundle(): boolean;
  /**
   * 切换 module
   * @param bundleName Bundle名
   * @param moduleName Module名
   */
  switchModule(bundleName: string, moduleName: string): boolean;

  /**
   * 预下载CodePush资源
   * @param bundleNames 需要下载的bundle列表
   */
  preDownloadCodePush(bundleNames: string[]): Promise<boolean>;

  /**
   * 上报CodePush进度
   */
  reportCodePushProgressShown(): Promise<void>;
}

export default TurboModuleRegistry.get<Spec>("XRNBundleModule") as Spec | null;
