import { AndroidSoftInputModeMap } from "./SoftInputMode.android";

const HARMONY = Object.freeze({
  OFFSET: 0,
  RESIZE: 1,
});

export type HarmonySoftInputModeMap = typeof HARMONY;

export const SOFT_INPUT_MODE = Object.freeze({
  ANDROID: {} as AndroidSoftInputModeMap,
  IOS: {},
  HARMONY,
} as const);
