import fs from "fs-extra";
import path from "path";

import { XRN_DIR } from "./Constants";
import { HarmonyLibInfo } from "./types";
import { findWorkspacePackage } from "./utils";

export const copyOhLibToPackage = async ({
  packageName,
  harmonyModuleName,
}: HarmonyLibInfo) => {
  const packageInfo = await findWorkspacePackage(packageName);
  if (!packageInfo) {
    console.error(`Package ${packageName} not found in workspace`);
    return;
  }
  const xrngoPath = path.join(XRN_DIR, "apps/xrngo");
  const packagePath = path.join(XRN_DIR, packageInfo.location);
  const packageHarmonyPath = path.join(packagePath, "harmony");
  const xrngoHarmonyLibHarPath = path.join(
    xrngoPath,
    `harmony/${harmonyModuleName}/build/default/outputs/default/${harmonyModuleName}.har`
  );

  if (!fs.existsSync(xrngoHarmonyLibHarPath)) {
    throw new Error("Harmony lib har not exists");
  }
  if (!fs.existsSync(packageHarmonyPath)) {
    throw new Error("Harmony lib not found in package");
  }
  // fs.renameSync(xrngoHarmonyLibHarPath, `${packageHarmonyPath}/${harmonyModuleName}.har`);
  fs.copyFileSync(
    xrngoHarmonyLibHarPath,
    `${packageHarmonyPath}/${harmonyModuleName}.har`
  );
};
