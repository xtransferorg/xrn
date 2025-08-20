import { requireNativeModule, Platform } from "@xrnjs/modules-core";

import { FileStatic, ImageOptions } from "./types";
import { Spec } from "../NativeFileModule";

const XRNFileModule = requireNativeModule<Spec>("XRNFileModule");

export const XRNFile: FileStatic = {
  clearFrescoCache(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      XRNFileModule?.clearFrescoCache()
        .then((value) => {
          resolve(value);
        })
        .catch((err) => {
          reject(err);
        }) || reject(Error("XRNFileModule is undefined or null"));
    });
  },
  insertImageToPhotoLibrary(options: ImageOptions): Promise<boolean> {
    return new Promise((resolve, reject) => {
      XRNFileModule?.insertImageToPhotoLibrary(options?.path, options?.fileName)
        .then((value) => {
          resolve(value);
        })
        .catch((err) => {
          reject(err);
        }) || reject(Error("XRNFileModule is undefined or null"));
    });
  },
};
