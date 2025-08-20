import { requireNativeModule, Platform } from "@xrnjs/modules-core";

import { Spec } from "../NativeXRNToastModule";
import { DurationMode, NativeToastStatic } from "./types";

// 处理Android端Toast不走NativeModule逻辑
let XRNToastModule: any;
if (Platform.OS === 'harmony' || Platform.OS === 'ios') {
  XRNToastModule = requireNativeModule<Spec>("XRNToastModule");
}

// const XRNToastModule = requireNativeModule<Spec>("XRNToastModule");

export const XRNNativeToast: NativeToastStatic = {
  showToast: (message: string, duration: DurationMode = 'SHORT') => {
    return new Promise<boolean>((resolve, reject) => {
      XRNToastModule?.showToast?.(message, duration)
        .then((res: boolean) => {
          resolve(res);
        })
        .catch((err: any) => {
          reject(err);
        });
    });
  },

  hideToast: () => {
    return new Promise<boolean>((resolve, reject) => {
      XRNToastModule?.hideToast?.()
        .then((res: boolean) => {
          resolve(res);
        })
        .catch((err: any) => {
          reject(err);
        });
    });
  },
};
