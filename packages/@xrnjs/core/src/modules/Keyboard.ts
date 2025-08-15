import { Platform } from "react-native";
import { NativeModules } from "react-native";

const NativeKeyboard = NativeModules.XRNKeyboard;

export enum AndroidSoftInputMode {
  SOFT_INPUT_MASK_STATE = 15,
  SOFT_INPUT_STATE_UNSPECIFIED = 0,
  SOFT_INPUT_STATE_UNCHANGED = 1,
  SOFT_INPUT_STATE_HIDDEN = 2,
  SOFT_INPUT_STATE_ALWAYS_HIDDEN = 3,
  SOFT_INPUT_STATE_VISIBLE = 4,
  SOFT_INPUT_STATE_ALWAYS_VISIBLE = 5,
  SOFT_INPUT_MASK_ADJUST = 240,
  SOFT_INPUT_ADJUST_UNSPECIFIED = 0,
  SOFT_INPUT_ADJUST_RESIZE = 16,
  SOFT_INPUT_ADJUST_PAN = 32,
  SOFT_INPUT_ADJUST_NOTHING = 48,
}


/**
 * 设置 Android 设备的软输入模式。
 *
 * @param mode - 要设置的软输入模式。
 * @returns 如果操作在 Android 设备上成功，则返回 `true` 的 Promise；如果平台不是 Android，则返回 `false`。
 * 
 * @platform android
 */
export const setSoftInputMode = async (
  mode: AndroidSoftInputMode
): Promise<boolean> => {
  if (Platform.OS !== "android") {
    return Promise.resolve(false);
  }

  return await NativeKeyboard.setSoftInputMode(mode);
};
