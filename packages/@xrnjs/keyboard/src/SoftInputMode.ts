import { AndroidSoftInputModeMap } from "./SoftInputMode.android";
import { HarmonySoftInputModeMap } from "./SoftInputMode.harmony";

export const SOFT_INPUT_MODE = Object.freeze({
  ANDROID: {} as AndroidSoftInputModeMap,
  HARMONY: {} as HarmonySoftInputModeMap,
} as const);
