import { TurboModuleRegistry } from "react-native";
import type { TurboModule } from "react-native/Libraries/TurboModule/RCTExport";

/**
 * 设备安全性结果
 */
export type CheckSysIntegrityResult = {
  result: string;
};

export interface Spec extends TurboModule {
  /**
   * 是否系统已 Root
   */
  isAppRooted(): Promise<boolean>;
  /**
   * 检查设备安全性
   */
  checkSysIntegrity(nonce: string): Promise<CheckSysIntegrityResult>;
  /**
   * 安装App
   * @param filePath 安装包路径
   */
  installApp(filePath: string): boolean;
  /**
   * 是否已安装特定App
   * @param pkgName App包名
   */
  isAppInstalled(pkgName: string): boolean;
  /**
   * 退出App
   */
  exitApp(): boolean;
  /**
   * 重启App
   */
  relaunchApp(): boolean;
  /**
   * App切到后台
   */
  moveTaskToBack(): boolean;
  /**
   * Android/Harmony：打开应用市场的 App 详情页
   * @param appPkgName Android App 包名；Harmony App bundleName
   * @param marketPgkName 应用市场包名
   */
  launchAppDetail(appPkgName: string, marketPgkName: string): Promise<void>;

  /**
   * GooglePlay应用市场是否已安装
   */
  isGooglePlayStoreInstalled(): Promise<boolean>;
}

export default TurboModuleRegistry.get<Spec>(
  "XRNAppUtilsModule",
) as Spec | null;
