import fs from "fs-extra";
import path from "path";
import semver from "semver";
import * as lockfile from "@yarnpkg/lockfile";
import logger from "./logger";

interface Params {
  projectPath: string;
  range: string;
  packageName: string;
}

export function checkDependenciesInRange({
  projectPath,
  range,
  packageName,
}: Params): boolean {
  let allInRange = true;

  const yarnLockPath = path.resolve(projectPath, "yarn.lock");

  if (!fs.existsSync(yarnLockPath)) {
    throw new Error("yarn.lock not found");
  }

  const yarnLockContent = fs.readFileSync(yarnLockPath, "utf-8");
  const yarnLock = lockfile.parse(yarnLockContent).object;

  for (const [key, value] of Object.entries(yarnLock)) {
    const [name] = key.split("@");
    if (name === packageName) {
      const version = value.version;
      if (
        !semver.satisfies(version, range, {
          includePrerelease: true,
        })
      ) {
        logger.error(
          `${packageName} version ${version} is out of range ${range}`
        );
        allInRange = false;
      }
    }
  }

  return allInRange;
}

export const checkXtRnCoreVersion = ({
  projectPath,
  appVersion,
  bundleName,
}: {
  projectPath: string;
  appVersion: string;
  bundleName: string;
}) => {
  const unsupportedBundleNames = ["xtapp"];
  const isUnsupportedBundleNames = unsupportedBundleNames.includes(bundleName);
  let isVersionValid = false;
  if (semver.lt(appVersion, "3.4.0")) {
    isVersionValid = checkDependenciesInRange({
      projectPath,
      range: "<1.5.1-0",
      packageName: "@xrnjs/core",
    });
  } else {
    isVersionValid = checkDependenciesInRange({
      projectPath,
      range: isUnsupportedBundleNames ? "1.5.1-0 - 2.0.0-0" : ">=2.0.1-0",
      packageName: "@xrnjs/core",
    });
  }
  if (!isVersionValid) {
    throw new Error("@xrnjs/core version is not valid");
  }
};
