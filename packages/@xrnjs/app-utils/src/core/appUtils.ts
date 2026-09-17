import { requireNativeModule, Platform } from "@xrnjs/modules-core";

import { AppUtilsStatic } from "./types";
import { CheckSysIntegrityResult, Spec } from "../NativeXRNAppUtilsModule";

const XRNAppUtilsModule = requireNativeModule<Spec>("XRNAppUtilsModule");

export const XRNAppUtils: AppUtilsStatic = {
  isAppRooted(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      XRNAppUtilsModule?.isAppRooted()
        .then((value) => {
          resolve(value);
        })
        .catch((error) => {
          reject(error);
        });
    });
  },
  installApp(filePath: string): void {
    XRNAppUtilsModule.installApp(filePath);
  },
  isAppInstalled(pkgName: string): boolean {
    return XRNAppUtilsModule.isAppInstalled(pkgName);
  },
  exitApp(): void {
    XRNAppUtilsModule.exitApp();
  },
  relaunchApp(): void {
    XRNAppUtilsModule.relaunchApp();
  },
  relaunchOrExit(): void {
    if (Platform.OS === "android") {
      XRNAppUtilsModule.relaunchApp();
    } else {
      XRNAppUtilsModule.exitApp();
    }
  },
  moveTaskToBack(): void {
    XRNAppUtilsModule.moveTaskToBack();
  },
  launchAppDetail(appPkgName: string, marketPkgName: string): Promise<void> {
    return XRNAppUtilsModule.launchAppDetail(appPkgName, marketPkgName);
  },
  checkSysIntegrity(nonce: string): Promise<CheckSysIntegrityResult> {
    return new Promise((resolve, reject) => {
      if (Platform.OS !== "harmony") {
        resolve({ result: "" });
        return;
      }

      XRNAppUtilsModule?.checkSysIntegrity(nonce)
        ?.then((result) => {
          resolve(result);
        })
        ?.catch((e) => {
          reject(e);
        });
    });
  },
};
