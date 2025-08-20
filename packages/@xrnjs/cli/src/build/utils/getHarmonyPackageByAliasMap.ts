import pathUtils from "path";
import fs from "fs";
import { RedirectedHarDep } from "../typing";

let cachedHarmonyPackageByAliasMap: Record<string, RedirectedHarDep> | undefined = undefined;

export function getHarmonyPackageByAliasMap(projectRootPath: string) {
  const initialAcc: Record<
    string,
    RedirectedHarDep
  > = {};
  if (cachedHarmonyPackageByAliasMap) {
    return cachedHarmonyPackageByAliasMap;
  }
  cachedHarmonyPackageByAliasMap = findHarmonyNodeModulePaths(
    findHarmonyNodeModuleSearchPaths(projectRootPath)
  ).reduce((acc, harmonyNodeModulePath) => {
    const harmonyNodeModulePathSegments = harmonyNodeModulePath.split(
      pathUtils.sep
    );
    let harmonyNodeModuleName =
      harmonyNodeModulePathSegments[harmonyNodeModulePathSegments.length - 1];
    if (harmonyNodeModulePathSegments.length > 1) {
      const harmonyNodeModuleParentDirName =
        harmonyNodeModulePathSegments[harmonyNodeModulePathSegments.length - 2];
      if (harmonyNodeModuleParentDirName.startsWith("@")) {
        harmonyNodeModuleName = `${harmonyNodeModuleParentDirName}/${harmonyNodeModuleName}`;
      }
    }
    const packageJSONPath = `${harmonyNodeModulePath}${pathUtils.sep}package.json`;
    const packageJSON = readHarmonyModulePackageJSON(packageJSONPath);
    const alias = packageJSON.harmony?.alias;
    const redirectInternalImports =
      packageJSON?.harmony?.redirectInternalImports ?? false;
    if (alias) {
      acc[alias] = {
        name: harmonyNodeModuleName,
        redirectInternalImports: redirectInternalImports,
        version: packageJSON.version,
        sourceDir: harmonyNodeModulePath,
      };
    }
    return acc;
  }, initialAcc);
  return cachedHarmonyPackageByAliasMap;
}

function findHarmonyNodeModuleSearchPaths(projectRootPath: string) {
  const nodeModulesPath = `${projectRootPath}${pathUtils.sep}node_modules`;
  const searchPaths = fs
    .readdirSync(nodeModulesPath)
    .filter((dirName) => dirName.startsWith("@"))
    .map((dirName) => `${nodeModulesPath}${pathUtils.sep}${dirName}`);
  searchPaths.push(nodeModulesPath);
  return searchPaths;
}

function findHarmonyNodeModulePaths(searchPaths: string[]) {
  return searchPaths
    .map((searchPath) => {
      return fs
        .readdirSync(searchPath)
        .map((dirName) => `${searchPath}${pathUtils.sep}${dirName}`)
        .filter(hasPackageJSON);
    })
    .flat();
}

function hasPackageJSON(nodeModulePath: string) {
  if (!fs.lstatSync(nodeModulePath).isDirectory()) return false;
  const nodeModuleContentNames = fs.readdirSync(nodeModulePath);
  return nodeModuleContentNames.includes("package.json");
}

function readHarmonyModulePackageJSON(packageJSONPath: string): {
  name: string;
  version: string;
  harmony?: { alias?: string; redirectInternalImports?: boolean };
} {
  return JSON.parse(fs.readFileSync(packageJSONPath).toString());
}
