import path from "path";
import process from "process";

export function getXrnRepositoryRootDir(): string {
  // XRN_ROOT_DIR is set locally by direnv
  return process.env.XRN_ROOT_DIR || path.join(__dirname, "..", "..", "..");
}

export function getXrnToolsDir(): string {
  return path.join(getPackagesDir(), "xrn-tools");
}

export function getBinDir(): string {
  return path.join(getXrnToolsDir(), "bin");
}

export function getPackagesDir(): string {
  return path.join(getXrnRepositoryRootDir(), "packages");
}

export function getTemplatesDir(): string {
  return path.join(getXrnRepositoryRootDir(), "templates");
}

export function getReactNativeSubmoduleDir(): string {
  return path.join(
    getXrnRepositoryRootDir(),
    "react-native-lab",
    "react-native"
  );
}

export function getAppsDir(): string {
  return path.join(getXrnRepositoryRootDir(), "apps");
}

export function getToolsTemplatesDir(): string {
  return path.join(getPackagesDir(), "xrn-tools/templates");
}
