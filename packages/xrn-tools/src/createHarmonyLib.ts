import fs from "fs-extra";
import json5 from "json5";
import path from "path";

import { XRN_DIR } from "./Constants";
import { HarmonyLibInfo } from "./types";
import { findWorkspacePackage } from "./utils";

export const createHarmonyLib = async ({
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
  const packageHarmonyLibPath = path.join(
    packagePath,
    "harmony",
    harmonyModuleName
  );
  const xrngoHarmonyLibPath = path.join(
    xrngoPath,
    "harmony",
    harmonyModuleName
  );

  const harmonyBuildProfilePath = path.join(
    xrngoPath,
    "harmony",
    "build-profile.json5"
  );

  if (fs.existsSync(xrngoHarmonyLibPath)) {
    throw new Error("Harmony lib already exists");
  }
  if (!fs.existsSync(packageHarmonyLibPath)) {
    throw new Error("Harmony lib not found in package");
  }

  fs.copySync(packageHarmonyLibPath, xrngoHarmonyLibPath);

  const buildProfileContent = fs.readFileSync(harmonyBuildProfilePath, "utf-8");
  const buildProfile = json5.parse(buildProfileContent);
  buildProfile.modules.push({
    name: harmonyModuleName,
    srcPath: `./${harmonyModuleName}`,
  });

  fs.writeFileSync(
    harmonyBuildProfilePath,
    json5.stringify(buildProfile, null, 2)
  );

  console.log(`Harmony lib ${harmonyModuleName} created in xrngo`);

};
