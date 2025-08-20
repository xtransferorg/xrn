import { TurboModuleRegistry } from "react-native";
import type { TurboModule } from "react-native/Libraries/TurboModule/RCTExport";

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

/**
 * 获取原生工程配置的bundle
 */
export type BundleItem = {
  /**
   * bundle名称
   */
  bundleName: string;
  /**
   * bundle对应的端口
   */
  port: string;
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
   * 获取原生的bundle列表
   */
  getBundleList(): Promise<BundleItem[]>;

  /**
   * 预加载指定 Bundle
   * @param bundleName Bundle名
   */
  preLoadBundle(bundleName: string): void;
  /**
   * 重新加载当前Bundle
   */
  reloadBundle(): void;
  /**
   * 切换 module
   * @param bundleName Bundle名
   * @param moduleName Module名
   */
  switchModule(bundleName: string, moduleName: string): void;
}

export default TurboModuleRegistry.get<Spec>("XRNBundleModule") as Spec | null;
