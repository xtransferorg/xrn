import { TurboModuleRegistry } from "react-native";
import type { TurboModule } from "react-native/Libraries/TurboModule/RCTExport";

export interface Spec extends TurboModule {
  // 清除 Fresco 缓存
  clearFrescoCache(): Promise<boolean>;
  /**
   * 插入图片到系统图库
   * @param path 
   */
  insertImageToPhotoLibrary(
    path: string,
    fileName: string | undefined,
  ): Promise<boolean>;
}

export default TurboModuleRegistry.get<Spec>("XRNFileModule") as Spec | null;
