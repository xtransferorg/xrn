import fs from "fs-extra";
import json5 from "json5";
import path from "path";

import { XRN_DIR } from "./Constants";
import { AddLibToOhEntryDep } from "./types";
import { findWorkspacePackage } from "./utils";

export const addModuleToOhEntryDep = async ({
  packageName,
  harmonyModuleName,
  sourceCode,
}: AddLibToOhEntryDep) => {
  const xrngoPath = path.join(XRN_DIR, "apps/xrngo");
  const harmonyBuildProfilePath = path.join(
    xrngoPath,
    "harmony",
    "build-profile.json5"
  );

  const buildProfileContent = fs.readFileSync(harmonyBuildProfilePath, "utf-8");
  const buildProfile = json5.parse(buildProfileContent);
  buildProfile.modules.push({
    name: harmonyModuleName,
    srcPath: `../../../packages/${packageName}/harmony/${harmonyModuleName}`,
  });

  fs.writeFileSync(
    harmonyBuildProfilePath,
    json5.stringify(buildProfile, null, 2)
  );

  console.log(
    `Harmony lib ${harmonyModuleName} added to xrngo entry dependencies`
  );
};

export const addLibToOhEntryDep = async ({
  packageName,
  harmonyModuleName,
  sourceCode,
}: AddLibToOhEntryDep) => {
  const packageInfo = await findWorkspacePackage(packageName);
  if (!packageInfo) {
    console.error(`Package ${packageName} not found in workspace`);
    return;
  }
  const xrngoPath = path.join(XRN_DIR, "apps/xrngo");
  const entryOhPackagePath = path.join(
    xrngoPath,
    "harmony",
    "entry",
    "oh-package.json5"
  );

  const json5Content = fs.readFileSync(entryOhPackagePath, "utf-8");
  const ohPackage = json5.parse(json5Content);

  if (sourceCode) {
    // 源码调试
    ohPackage.dependencies[packageName] =
      `../../../../packages/${packageName}/harmony/${harmonyModuleName}`;
  } else {
    ohPackage.dependencies[packageName] =
      `../../node_modules/${packageName}/harmony/${harmonyModuleName}.har`;
  }

  fs.writeFileSync(entryOhPackagePath, json5.stringify(ohPackage, null, 2));

  addModuleToOhEntryDep({ packageName, harmonyModuleName, sourceCode });
};
