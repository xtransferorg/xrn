import { TurboModuleRegistry } from "react-native";
import type { TurboModule } from "react-native/Libraries/TurboModule/RCTExport";

export interface Spec extends TurboModule {
  /**
   * 显示 loading 动画
   * @returns 空
   */
  showLoading(): void;
  /**
   * 更新loading动画进度条
   * @param value - 1-100
   * @returns  空
   */
  updateProgress(value: number): void;
  /**
   * 隐藏 loading 动画
   * @returns 空
   */
  hideLoading(): void;
  /**
   * 用于App冷启动 Logo 显示
   */
  show(): void;
  /**
   * App冷启动的 Logo 隐藏
   */
  hide(): void;
}

export default TurboModuleRegistry.get<Spec>("XRNLoadingModule") as Spec | null;
