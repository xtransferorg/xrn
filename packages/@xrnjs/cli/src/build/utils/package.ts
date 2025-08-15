import logger from "../../utlis/logger";
import { DepInfo, Platform, RepInfo } from "../typing";
import { execShellCommand } from "./shell";

import fs from "fs-extra";
import path from "path";
import { getHarmonyPackageByAliasMap } from "./getHarmonyPackageByAliasMap";
import assert from "assert";
import { DEPENDENCIES_CHECK_WHITELIST } from "../constants";

// types/PackageJson.ts
export interface PackageJson {
  name: string;
  version: string;
  description?: string;
  main?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  harmony?: Record<string, any>; // 自定义字段
  [key: string]: unknown; // 允许额外的字段
}

/**
 * 读取并解析 package.json 文件
 * @param {string} dir - package.json 所在目录
 * @returns {Promise<Object>} 解析后的 package.json 对象
 */
export async function readPackageJson(dir: string): Promise<PackageJson> {
  const packageJsonPath = path.join(dir, "package.json");

  try {
    const data = await fs.readFile(packageJsonPath, "utf-8");
    return JSON.parse(data) as PackageJson;
  } catch (error) {
    console.error(`Error reading package.json from ${dir}:`, error);
    throw error;
  }
}

export function readPackageJsonSync(dir: string) {
  const packageJsonPath = path.join(dir, "package.json");
  const data = fs.readFileSync(packageJsonPath, "utf-8");
  return JSON.parse(data) as PackageJson;
}

export async function installPackages(
  bundleRepo: RepInfo,
  packagePath: string,
  isFromCodePush: boolean = false,
) {
  const branchPath = `${packagePath}/${bundleRepo.name}`;
  logger.info(`下载依赖 ${isFromCodePush ? packagePath : branchPath}`);
  await execShellCommand(`yarn`, {
    cwd: isFromCodePush ? packagePath : branchPath,
  });
}

/**
 * 使用广度优先遍历获取所有 node_modules 中有效 npm 包路径（包含 package.json）
 * @param rootDir 起始目录，默认是 process.cwd()
 * @returns 所有有效 npm 包路径数组
 */
export function getAllValidNodeModulesPathsBFS(
  rootDir: string = process.cwd(),
): string[] {
  const visited = new Set<string>();
  const results: string[] = [];
  const queue: string[] = [rootDir];

  while (queue.length > 0) {
    const currentDir = queue.shift();
    const nodeModulesPath = path.join(currentDir, "node_modules");

    if (!fs.existsSync(nodeModulesPath)) continue;

    const entries = fs.readdirSync(nodeModulesPath);
    for (const entry of entries) {
      const entryPath = path.join(nodeModulesPath, entry);

      if (entry.startsWith(".")) {
        // 跳过隐藏目录
        continue;
      } else if (entry.startsWith("@")) {
        // 处理作用域包
        const scopedEntries = fs.readdirSync(entryPath);
        for (const scopedEntry of scopedEntries) {
          const packagePath = path.join(entryPath, scopedEntry);
          if (
            fs.existsSync(packagePath) &&
            fs.statSync(packagePath).isDirectory()
          ) {
            if (visited.has(packagePath)) continue;
            visited.add(packagePath);

            const pkgJson = path.join(packagePath, "package.json");
            if (fs.existsSync(pkgJson)) {
              results.push(packagePath);
            }

            queue.push(packagePath); // 加入队列继续向下遍历
          }
        }
      } else {
        // 普通包
        if (fs.existsSync(entryPath) && fs.statSync(entryPath).isDirectory()) {
          if (visited.has(entryPath)) continue;
          visited.add(entryPath);

          const pkgJson = path.join(entryPath, "package.json");
          if (fs.existsSync(pkgJson)) {
            results.push(entryPath);
          }

          queue.push(entryPath); // 加入队列继续向下遍历
        }
      }
    }
  }

  return results;
}

const getWhiteListWithCache = async () => {
  return DEPENDENCIES_CHECK_WHITELIST;
};

export function getAllNativeDeps(
  root: string,
  platforms: Platform[] = [Platform.Android, Platform.iOS, Platform.Harmony],
  whitelist: string[] = [],
) {
  const nativeDeps: Record<string, DepInfo> = {};
  const nodeModulePaths = getAllValidNodeModulesPathsBFS(root);

  // 重复的依赖
  const duplicateDeps: string[] = [];

  for (const nodeModulePath of nodeModulePaths) {
    const dirs = fs.readdirSync(nodeModulePath);
    if (platforms.some((dir) => dirs.includes(dir))) {
      const depPackage = readPackageJsonSync(nodeModulePath);
      if (nativeDeps[depPackage.name]) {
        if (
          nodeModulePath.includes("@types") ||
          whitelist.includes(depPackage.name)
        ) {
          continue;
        }
        if (nodeModulePath.includes("@react-native-oh-tpl")) {
          // 由于一些鸿蒙依赖设计版本降级，暂不处理
          continue;
        }
        const obj = {
          dep1: {
            path: nativeDeps[depPackage.name].root,
            version: nativeDeps[depPackage.name].version,
          },
          dep2: {
            path: nodeModulePath,
            version: depPackage.version,
          },
        };
        logger.error(
          `重复的依赖 ${depPackage.name}, ${JSON.stringify(obj, null, 2)}`,
        );
        duplicateDeps.push(depPackage.name);
        continue;
      }
      nativeDeps[depPackage.name] = {
        name: depPackage.name,
        version: depPackage.version,
        platforms: {
          android: dirs.includes(Platform.Android)
            ? {
                sourceDir: path.join(nodeModulePath, Platform.Android),
              }
            : null,
          ios: dirs.includes(Platform.iOS)
            ? {
                sourceDir: path.join(nodeModulePath, Platform.iOS),
              }
            : null,
          harmony: dirs.includes(Platform.Harmony)
            ? {
                sourceDir: path.join(nodeModulePath, Platform.Harmony),
                ...(depPackage.harmony || {}),
              }
            : null,
        },
        root: nodeModulePath,
      };
    }
  }
  return {
    nativeDeps,
    duplicateDeps,
  };
}

export async function checkHarmonyDeps({
  bundlePath,
  bundleName,
  nativeDeps,
}: {
  bundlePath: string;
  bundleName: string;
  nativeDeps: Record<string, DepInfo>;
}) {
  const map = getHarmonyPackageByAliasMap(bundlePath);
  const DEPENDENCIES_CHECK_WHITELIST = await getWhiteListWithCache();
  const { nativeDeps: bundlePackageDeps, duplicateDeps } = getAllNativeDeps(
    bundlePath,
    [Platform.Android, Platform.iOS, Platform.Harmony],
    DEPENDENCIES_CHECK_WHITELIST.harmony,
  );

  let checkError = !!duplicateDeps.length;

  // 获取未重定向的原生依赖
  for (const [name, value] of Object.entries(bundlePackageDeps)) {
    if (DEPENDENCIES_CHECK_WHITELIST.harmony.includes(name)) {
      continue;
    }
    const { android, ios, harmony } = value?.platforms || {};
    if (android || ios || harmony) {
      const bundleDep = bundlePackageDeps[name];
      const nativeDep = nativeDeps[name];

      if (!nativeDep) {
        logger.error(`原生依赖不存在${name}但${bundleName}存在`);
        checkError = true;
      } else if (nativeDep.version !== bundleDep.version) {
        logger.error(
          `原生依赖 ${name} 版本校验失败：${bundleName} 中的版本：${bundleDep.version}；原生仓库中的版本：${nativeDep.version}`,
        );
        checkError = true;
      }

      if (!harmony) {
        // 没有鸿蒙实现的原生依赖，则必须要重定向实现
        const mappedHarmonyPackageName = map[name]?.name;
        const mappedHarmonyPackageVersion = map[name]?.version;
        // 安卓或 iOS 原生依赖，没有在内部实现鸿蒙
        if (mappedHarmonyPackageName) {
          const harmonyNativeVersion =
            nativeDeps[mappedHarmonyPackageName].version;
          const harmonyBundleVersion = mappedHarmonyPackageVersion;
          if (harmonyNativeVersion) {
            assert(
              harmonyNativeVersion,
              `${mappedHarmonyPackageName} 原生仓库中版本不存在`,
            );
            assert(
              harmonyBundleVersion,
              `${mappedHarmonyPackageName} bundle仓库中版本不存在`,
            );
            if (harmonyBundleVersion !== harmonyNativeVersion) {
              logger.error(
                `鸿蒙依赖 ${mappedHarmonyPackageName} 版本校验失败：${bundleName} 中的版本：${harmonyBundleVersion}；原生仓库中的版本：${harmonyNativeVersion}`,
              );
              checkError = true;
            }
          } else {
            logger.error(`原生依赖不存在${name}但${bundleName}存在`);
            checkError = true;
          }
        } else {
          logger.error(`原生依赖 ${name} 不存在鸿蒙实现且未重定向`);
          checkError = true;
        }
      } else {
        // 如果是内部已鸿蒙实现的原生依赖
      }
    }
  }
  return checkError;
}

interface CheckDepParams {
  bundlePath: string;
  bundleName: string;
  nativeDeps: Record<string, DepInfo>;
  platform: Platform;
}

const checkDeps = async ({
  bundlePath,
  bundleName,
  nativeDeps,
  platform,
}: CheckDepParams) => {
  const DEPENDENCIES_CHECK_WHITELIST = await getWhiteListWithCache();
  const { nativeDeps: bundleNativeDeps, duplicateDeps } = getAllNativeDeps(
    bundlePath,
    [platform],
    DEPENDENCIES_CHECK_WHITELIST[platform],
  );
  let checkError = !!duplicateDeps.length;
  for (const key in bundleNativeDeps) {
    if (DEPENDENCIES_CHECK_WHITELIST[platform].includes(key)) {
      continue;
    }
    // eslint-disable-next-line no-prototype-builtins
    if (!nativeDeps.hasOwnProperty(key)) {
      logger.error(`原生依赖不存在${key}但${bundleName}存在`);
      checkError = true;
    } else if (
      bundleNativeDeps[key] &&
      nativeDeps[key].version !== bundleNativeDeps[key].version
    ) {
      logger.error(
        `原生依赖 ${key} 版本校验失败：${bundleName} 中的版本：${bundleNativeDeps[key].version}；原生仓库中的版本：${nativeDeps[key].version}`,
      );
      checkError = true;
    }
  }

  // logger.info("native依赖校验成功");
  return checkError;
};

export const checkBundleDependencies = async ({
  bundlePath,
  bundleName,
  nativeDeps,
  platform,
}: CheckDepParams) => {
  logger.info(`开始校验${bundleName}原生依赖是否一致`);
  if (Platform.Harmony === platform) {
    return await checkHarmonyDeps({
      bundlePath,
      bundleName,
      nativeDeps,
    });
  } else {
    return await checkDeps({
      bundlePath,
      bundleName,
      nativeDeps,
      platform,
    });
  }
};
