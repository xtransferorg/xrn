import { AndroidSoftInputModeMap } from "./SoftInputMode.android";
import { HarmonySoftInputModeMap } from "./SoftInputMode.harmony";

type ValueOf<T> = T[keyof T];

export type AndroidSoftInputMode = ValueOf<AndroidSoftInputModeMap>;
export type HarmonySoftInputMode = ValueOf<HarmonySoftInputModeMap>;

export type SoftInputMode = AndroidSoftInputMode | HarmonySoftInputMode;
