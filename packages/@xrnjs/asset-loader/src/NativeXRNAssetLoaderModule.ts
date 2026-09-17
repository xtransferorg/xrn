import { TurboModuleRegistry } from "react-native";
import type { TurboModule } from "react-native/Libraries/TurboModule/RCTExport";

export interface Spec extends TurboModule {
  /**
   * 判断当前图片资源文件是否存在（同步方法）
   * @param filePath 文件绝对路径
   * @returns 文件是否存在
   */
  isFileExist(filePath: string | null): boolean;

  /**
   * 搜索JSBundle文件所在目录下的所有drawable资源文件
   * @param jsBundleFilePath JSBundle文件路径
   * @returns 所有drawable资源文件路径数组
   */
  searchDrawableFile(
    jsBundleFilePath: string | null,
    callback: (result: string[]) => void,
  ): void;

  /**
   * 获取CodePush Raw资源文件内容（react-native-svg 中会用到）
   * @param jsBundlePath JSBundle文件路径
   * @param fileName 文件名
   * @returns 文件内容，如果文件不存在则返回 null
   */
  getCodePushRawResource(
    jsBundlePath: string | null,
    fileName: string | null
  ): Promise<string | null>;

  /**
   * 新架构中获取模块导出的常量（替代已废弃的 constantsToExport）
   * @returns 包含 DefaultMainBundlePath 等常量的对象，iOS 专有
   */
  getConstants?: () => {
    DefaultMainBundlePath?: string;
  };
}
export default TurboModuleRegistry.get<Spec>("RNPAssetsLoad") as Spec | null;
