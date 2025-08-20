import { NativeModules } from "react-native";
import { XRNNativeStorage } from "@xrnjs/native-storage";
import { Platform } from "@xrnjs/modules-core";

const XRNDebugToolsModule = NativeModules?.XRNDebugToolsModule;

export function getItemSync(spName: string, key: string): string | null {
  if (Platform.OS === "android") {
    return XRNDebugToolsModule?.getNativeStorageSync?.(spName, key);
  } else {
    return XRNNativeStorage?.getItemSync?.(key);
  }
}

export function setItemSync(
  spName: string,
  key: string,
  value: string,
): boolean {
  let result = false;
  if (Platform.OS === "android") {
    result = XRNDebugToolsModule?.setNativeStorageSync?.(spName, key, value);
  } else {
    result = XRNNativeStorage?.setItemSync?.(key, value);
  }
  return result;
}
