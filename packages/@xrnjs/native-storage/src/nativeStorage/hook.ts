import { XRNNativeStorage } from "./nativeStorage";
import type { NativeStorageHook } from "./types";

export function useNativeStorage(key: string): NativeStorageHook {
  return {
    getItem: (...args) => XRNNativeStorage.getItem(key, ...args),
    setItem: (...args) => XRNNativeStorage.setItem(key, ...args),
    removeItem: (...args) => XRNNativeStorage.removeItem(key, ...args),
    getItemSync: (...args) => XRNNativeStorage.getItemSync(key, ...args),
    setItemSync: (...args) => XRNNativeStorage.setItemSync(key, ...args),
    removeItemSync: (...args) => XRNNativeStorage.removeItemSync(key, ...args),
  };
}
