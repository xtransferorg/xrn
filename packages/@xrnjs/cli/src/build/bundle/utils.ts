/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import type { MetaConfig } from "./interface";
import { parsePatchFile } from "patch-package/dist/patch/parse";
import { BuildEnv, BuildType, Platform } from "../typing";
import {
  COMMON_BASE_KEY,
} from "../../codePush/diff";
import path from "path";
import fs from "fs";
import logger from "../../utlis/logger";
import crypto from "crypto";
import { BundleExt, BundleFileName } from "./constant";
import fsPromise from "fs/promises";
import { PackageJson } from "../utils/package";
import { BaseLineFileType } from "../BaselineManager";
import { BaselineManagerFactory } from "../BaselineManagerFactory";

function parsePathToArray(filePath: string) {
  const parts = filePath.split(path.sep);
  const result = [];
  let currentPath = "";

  for (const part of parts) {
    currentPath = currentPath ? path.join(currentPath, part) : part;
    result.push("/" + currentPath);
  }

  return result;
}

export function findVersion(module: string, basePath: string) {
  const keys: string[] = parsePathToArray(module).reverse() as string[];
  const filepaths: string[] = [];
  for (const key of keys) {
    if (/node_modules$/.test(key)) {
      break;
    } else {
      filepaths.push(key);
    }
  }
  const packagePath = filepaths.reverse().find((key) => {
    const filename = path.join(basePath, key);
    if (isExistDir(filename)) {
      const filepath = path.join(filename, "package.json");
      if (fs.existsSync(filepath)) {
        return true;
      }
    }
    return null;
  });
  return (
    packagePath &&
    (require(path.join(basePath, packagePath, "package.json")) as PackageJson)
      .version
  );
}

export function chdir(dir: string) {
  const cwd = process.cwd();
  logger.info(`set chdir: ${dir}`);
  process.chdir(dir);
  return () => {
    process.chdir(cwd);
    logger.info(`restore chdir: ${cwd}`);
  };
}

export function isExistDir(dir: string) {
  return fs.existsSync(dir) && fs.statSync(dir).isDirectory();
}

export function isExistFile(dir: string) {
  return fs.existsSync(dir);
}

/**
 * 构建模块映射表，包含模块路径、版本和hash信息
 */
export async function buildModuleMap(
  fileToIdMap: Map<string, number>,
  basePath: string
): Promise<Record<string, { id: number; version: string; hash: string }>> {
  const moduleMap = {};
  const entries = [...fileToIdMap];

  await Promise.all(
    entries.map(async ([filePath, moduleId]) => {
      try {
        const hash = await getFileHash(filePath);

        let normalizedPath = filePath
          .replace(/^\/private/, "")
          .replace(basePath + "/", "");

        const version = findVersion(normalizedPath, basePath);
        normalizedPath = normalizedPath.replace(
          /^.*node_modules\//,
          "node_modules/"
        );

        // 只处理node_modules中的模块
        if (!/^node_modules/.test(normalizedPath)) return;

        moduleMap[`${normalizedPath}@${version}`] = {
          id: moduleId,
          version: version || "0.0.0",
          hash,
        };
      } catch (err) {
        console.error(`Failed to hash file ${filePath}:`, err);
      }
    })
  );

  return moduleMap;
}

/**
 * 构建模块路径到hash-id映射的查找表
 */
export function buildModuleHashLookup(
  metaConfig: MetaConfig
): Record<string, Record<string, number>> {
  if (!metaConfig.version) {
    return {};
  }

  return Object.entries(metaConfig.modules).reduce(
    (lookup, [moduleKey, { hash, id }]) => {
      const match = moduleKey.match(
        /^(.+\.(?:js|jsx|ts|tsx|json|svg|png))@([\w.-]+)$/
      );
      if (!match) {
        throw new Error(
          `模块 ${moduleKey} 的格式不正确，应该是 <path>@<version>`
        );
      }

      const modulePath = match[1];
      if (lookup[modulePath]) {
        lookup[modulePath][hash] = id;
      } else {
        lookup[modulePath] = { [hash]: id };
      }

      return lookup;
    },
    {} as Record<string, Record<string, number>>
  );
}

/**
 * 查找polyfills文件路径
 */
export function findPolyfillsPath(basePath: string): string {
  let polyfillsPath = path.resolve(
    basePath,
    "node_modules/@react-native/js-polyfills/index.js"
  );

  if (!fs.existsSync(polyfillsPath)) {
    polyfillsPath = path.resolve(
      basePath,
      "node_modules/@react-native/polyfills/index.js"
    );
  }

  return polyfillsPath;
}

/**
 * 获取Metro运行时相关路径
 */
export function getMetroRuntimePaths(basePath: string) {
  return {
    requirePolyfill: path.resolve(
      basePath,
      "node_modules/metro-runtime/src/polyfills/require.js"
    ),
    asyncRequire: path.resolve(
      basePath,
      "node_modules/metro-runtime/src/modules/asyncRequire.js"
    ),
    emptyModule: path.resolve(
      basePath,
      "node_modules/metro-runtime/src/modules/empty-module.js"
    ),
  };
}

/**
 * 获取React Native核心模块路径
 */
export function getReactNativePaths(basePath: string, platform: Platform) {
  const initializeCore =
    platform === Platform.Harmony
      ? path.resolve(
          basePath,
          "node_modules/@react-native-oh/react-native-harmony/Libraries/Core/InitializeCore.js",
        )
      : path.resolve(
          basePath,
          "node_modules/react-native/Libraries/Core/InitializeCore.js",
        );
  return {
    initializeCore: initializeCore,
    jsPolyfills: path.resolve(
      basePath,
      "node_modules/@react-native/js-polyfills",
    ),
  };
}

interface PatchNormalized {
  type: string;
  path: string; // "node_modules/react-native/Libraries/Blob/FileReader.js"
  hunks: {
    header: {
      original: {
        start: number;
        length: number;
      };
      patched: {
        start: number;
        length: number;
      };
    };
    parts: {
      type: string; // "context"
      lines: string[];
      noNewlineAtEndOfFile: boolean;
    }[];
    source: string;
  }[];
  beforeHash: string; // "51185fc";
  afterHash: string; // "b1b3b7b";
}

export async function invalidatePatch(root: string, meta: MetaConfig) {
  if (!isExistDir(root)) {
    return;
  }
  const patches = await fsPromise.readdir(root);
  if (patches.length === 0) {
    return;
  }
  return await Promise.all(
    patches.map(async (patch) => {
      const normalized: PatchNormalized[] = (
        parsePatchFile as (a: string) => PatchNormalized[]
      )(await fsPromise.readFile(`${root}/${patch}`, "utf-8"));
      normalized.forEach((n) => {
        if (meta.modules[n.path]) {
          // TODO 在拆包稳定后需要去掉
          logger.warn(
            `${n.path} 模块维护在 common bundle 中，不允许对其进行 patch`
          );
          // throw new Error(
          //   `${n.path} 模块维护在 common bundle 中，不允许对其进行 patch`
          // );
        }
      });
      return normalized;
    })
  );
}

interface IMetaConfig {
  version: string;
  platform: Platform;
  project?: string;
  buildType?: BuildType;
  buildEnv: BuildEnv;
  temp?: string;
}

const getBaseJson: {
  (config: IMetaConfig): Promise<any>;
  initialized?: boolean;
} = async ({
  version,
  platform,
  buildType = BuildType.DEBUG,
  buildEnv,
}) => {
  // const tmp = temp || (await initBaseLineRepoFn());
  const baselineManager = BaselineManagerFactory.createOrGet({
    platform,
    version,
    buildEnv,
    buildType
  })
  if (!getBaseJson.initialized) {
    await baselineManager.downloadFiles({file_types: [BaseLineFileType.META] });
    getBaseJson.initialized = true
  }
  return baselineManager.baseRepoManage();
}

export async function getMetaJson({
  version,
  platform,
  project = "xrn",
  buildType = BuildType.DEBUG,
  buildEnv,
  temp = "",
}: IMetaConfig): Promise<MetaConfig> {
  const { pkg } = await getBaseJson({
    version,
    platform,
    project,
    buildType,
    buildEnv,
    temp,
  });
  try {
    const meta = (require(pkg.get()) as PackageJson)[COMMON_BASE_KEY];

    return meta as MetaConfig;
  } catch {
    throw new Error(`app: ${version} ${pkg.get()} 文件未找到`);
  }
}

export async function getDependenciesJson({
  version,
  platform,
  project = "xrn",
  buildType = BuildType.DEBUG,
  buildEnv,
  temp = "",
}: IMetaConfig) {
  const { pkg } = await getBaseJson({
    version,
    platform,
    project,
    buildType,
    buildEnv,
    temp,
  });
  try {
    const dependencies = require(pkg.get()).dependencies;

    return dependencies;
  } catch {
    throw new Error(`app: ${version} ${pkg.get()} 文件未找到`);
  }
}

export function getFileHash(filePath: string, algorithm = "sha256") {
  return new Promise<string>((resolve, reject) => {
    const hash = crypto.createHash(algorithm);
    const stream = fs.createReadStream(filePath);

    stream.on("data", (chunk) => {
      hash.update(chunk as string);
    });

    stream.on("end", () => {
      resolve(hash.digest("hex"));
    });

    stream.on("error", (err) => {
      reject(err);
    });
  });
}

export function getBundleName(platform: string, name = "xt-app-common") {
  return `${BundleFileName[platform]}${name}.${BundleExt[platform]}`;
}

export function getBundleMapName(platform: string, name = "xt-app-common") {
  return `${BundleFileName[platform]}${name}.${BundleExt[platform]}.map`;
}
