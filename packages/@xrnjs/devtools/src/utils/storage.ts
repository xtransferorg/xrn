import { Platform, requireNativeModule } from "@xrnjs/modules-core";
import { XRNNativeStorage } from "@xrnjs/native-storage";
import {XRNDebugToolsModule} from '@xrnjs/debug-tools'


export function getItemSync(spName: string, key: string): string | null | undefined {
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
    result = XRNDebugToolsModule?.setNativeStorageSync?.(spName, key, value) ?? false;
  } else {
    result = XRNNativeStorage?.setItemSync?.(key, value);
  }
  return result;
}
