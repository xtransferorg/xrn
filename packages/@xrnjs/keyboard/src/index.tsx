import { requireNativeModule } from "@xrnjs/modules-core";

import { SOFT_INPUT_MODE } from "./SoftInputMode";
import {
  KeyboardInfo,
  KeyboardType,
  Spec,
} from "./native/NativeXRNKeyboardModule";

const XRNKeyboardModule = requireNativeModule<Spec>("XRNKeyboard");

export * from "react-native-keyboard-manager";

export * from "./native/NativeXRNKeyboardModule";

export const XRNKeyboard: Spec = {
  // @ts-ignore
  SOFT_INPUT_MODE,
  setSoftInputMode(mode: string): Promise<boolean> {
    return XRNKeyboardModule?.setSoftInputMode(mode) || Promise.resolve(false);
  },

  setKeyboard(
    reactTag: number,
    keyboardType: KeyboardType,
    scrollTag: number,
    keyboardInfo: KeyboardInfo,
  ): Promise<boolean> {
    return (
      XRNKeyboardModule?.setKeyboard(
        reactTag,
        keyboardType,
        scrollTag,
        keyboardInfo,
      ) || Promise.resolve(false)
    );
  },

  getKeyboardContentNativeID(): Promise<string> {
    return (
      XRNKeyboardModule?.getKeyboardContentNativeID() ||
      Promise.resolve("keyboard_content_native_id")
    );
  },
};
