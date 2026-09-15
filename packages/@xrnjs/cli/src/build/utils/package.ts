import logger from "../../utlis/logger";
import { DepInfo, Platform, RepInfo } from "../typing";
import { execShellCommand } from "./shell";

import fs from "fs-extra";
import path from "path";
// import loadNativeConfig from "@react-native-community/cli-config";
import type { Config } from "@react-native-community/cli-types";

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

export function getSubBundlePackageJson(subBundleList: RepInfo[]) {
  return subBundleList.reduce((acc, subBundle) => {
    acc[subBundle.name] = readPackageJsonSync(subBundle.name);
    return acc;
  }, {} as Record<string, PackageJson>);
}

export async function installPackages(
  bundleRepo: RepInfo,
  packagePath: string,
  isFromCodePush: boolean = false
) {
  const branchPath = `${packagePath}/${bundleRepo.name}`;
  logger.info(`下载依赖 ${isFromCodePush ? packagePath : branchPath}`);
  await execShellCommand(`yarn`, {
    cwd: isFromCodePush ? packagePath : branchPath,
  });
}

export const loadNativeConfigByCli = async (root: string): Promise<Config> => {
  const out = await execShellCommand(`npx react-native config`, { cwd: root });
  return JSON.parse(out) as Config;
};

export async function loadReactNativeConfigDeps(root: string) {
  // const config = loadNativeConfig(root);
  const config = await loadNativeConfigByCli(root);

  const dependenciesWithVersions: Record<string, DepInfo> = {};

  Object.entries(config.dependencies).forEach(([name, depConfig]) => {
    // 从 package.json 读取版本号
    const pkgPath = path.join(depConfig.root, "package.json");
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
      dependenciesWithVersions[name] = {
        ...depConfig,
        version: pkg.version,
      };
    } else {
      throw new Error(`${name} 的 package.json 不存在`);
    }
  });

  const simpleDeps = simplifyNativeDeps(dependenciesWithVersions, root);

  return simpleDeps;
}

export function filterNativeDeps(
  nativeDeps: Record<string, DepInfo>,
  platform: Platform
): Record<string, DepInfo> {
  return (
    Object.entries(nativeDeps)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .filter(([name, dep]) => {
        return dep.platforms[platform];
      })
      .reduce((acc, [name, dep]) => {
        acc[name] = dep;
        return acc;
      }, {} as Record<string, DepInfo>)
  );
}

export async function getNativeDeps(root: string, platform: Platform) {
  const dependencies = await loadReactNativeConfigDeps(root);
  // 过滤出 platform 的依赖
  const platformDependencies = Object.entries(dependencies)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .filter(([name, dep]) => {
      return dep.platforms[platform];
    })
    .reduce((acc, [name, dep]) => {
      acc[name] = dep.version;
      return acc;
    }, {} as Record<string, string>);
  return platformDependencies;
}

/**
 * 简化 DepInfo 数据，只保留必要字段并将路径转换为从 node_modules 开始的相对路径
 * @param nativeDeps 原始的依赖信息对象
 * @param projectRoot 项目根目录路径
 * @returns 简化后的依赖信息对象
 */
export function simplifyNativeDeps(
  nativeDeps: Record<string, DepInfo>,
  projectRoot: string
): Record<string, DepInfo> {
  const result: Record<string, DepInfo> = {};

  Object.entries(nativeDeps).forEach(([name, depInfo]) => {
    // 将 root 路径转换为从 node_modules 开始的相对路径
    const relativeRoot = path.relative(projectRoot, depInfo.root);

    // 构建简化的 platforms 对象
    const simplifiedPlatforms: DepInfo["platforms"] = {};

    if (depInfo.platforms.android) {
      const relativeAndroidPath = depInfo.platforms.android.sourceDir
        ? path.relative(projectRoot, depInfo.platforms.android.sourceDir)
        : path.join(relativeRoot, "android");
      simplifiedPlatforms.android = { sourceDir: relativeAndroidPath };
    }

    if (depInfo.platforms.ios) {
      simplifiedPlatforms.ios = { sourceDir: path.join(relativeRoot, "ios") };
    }

    if (depInfo.platforms.harmony) {
      simplifiedPlatforms.harmony = { sourceDir: path.join(relativeRoot, "harmony") };
    }

    result[name] = {
      name: depInfo.name,
      version: depInfo.version,
      root: relativeRoot,
      platforms: simplifiedPlatforms,
    };
  });

  return result;
}

/**
 * 使用广度优先遍历获取所有 node_modules 中有效 npm 包路径（包含 package.json）
 * @param rootDir 起始目录，默认是 process.cwd()
 * @returns 所有有效 npm 包路径数组
 */
export function getAllValidNodeModulesPathsBFS(
  rootDir: string = process.cwd()
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

export function getAllNativeDeps(
  root: string,
  platforms: Platform[] = [Platform.Android, Platform.iOS, Platform.Harmony]
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
        if (nodeModulePath.includes("@types")) {
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
          `重复的依赖 ${depPackage.name}, ${JSON.stringify(obj, null, 2)}`
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
    nativeDeps: simplifyNativeDeps(nativeDeps, root),
    duplicateDeps,
  };
}
