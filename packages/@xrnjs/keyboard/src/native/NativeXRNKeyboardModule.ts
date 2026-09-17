import { TurboModuleRegistry } from "react-native";
import type { TurboModule } from "react-native/Libraries/TurboModule/RCTExport";

/**
 * 输入法交互模式
 * reeize: 页面重新计算高度，
 * pan: 键盘弹起时，如果遮挡输入框，整个页面上浮（可能会顶出屏幕）
 * auto: 和 pan 类似，但是在指定 可滚动组件 & 内容根组件的情况下，不会顶出屏幕
 */
// export type SoftInputMode = "resize" | "pan" | "auto";
export enum SoftInputMode {
  Resize = "resize",
  Pan = "pan",
  Auto = "auto",
}
/**
 * 输入法交互模式额外数据
 */
export type SoftInputModeExtra = {
  /**
   * 输入框和键盘之间的间隔
   */
  softInputSpace: number;
};

/**
 * 自定义键盘类型
 * amount: 数字金额键盘
 * system: 系统键盘
 */
// export type KeyboardType = "amount" | "system";
export enum KeyboardType {
  Amount = "amount",
  System = "system",
}

/**
 * 数字金额键盘的业务数据
 */
export type AmountInfo = {
  /**
   * 小数点
   */
  decimalType?: string;
  /**
   * 初始快捷数据
   * 输入框为空时显示
   */
  initFastDataArray?: string[];
  /**
   * 快捷数据
   * 输入框不为空时显示
   */
  fastDataArray?: string[];
  /**
   * 完成
   */
  doneDesc?: string;
};

/**
 * 键盘业务数据
 */
export type KeyboardInfo = AmountInfo;

export interface Spec extends TurboModule {

  /**
   * 获取 Keyboard.Content nativeID
   */
  getKeyboardContentNativeID(): Promise<string>;

  setSoftInputMode(mode: string): Promise<boolean>;

  /**
   * 输入框绑定自定义键盘
   * @param reactTag
   * @param keyboardType
   * @param scrollTag
   * @param keyboardInfo
   */
  setKeyboard(
    reactTag: number,
    keyboardType: KeyboardType,
    scrollTag: number,
    keyboardInfo: KeyboardInfo,
  ): Promise<boolean>;
}

export default TurboModuleRegistry.get<Spec>("XRNKeyboard") as Spec | null;
