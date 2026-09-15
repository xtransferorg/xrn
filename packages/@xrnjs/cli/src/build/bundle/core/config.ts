import type { InputConfigT } from "metro-config";
import type { MetaConfig } from "../interface";
import { Platform } from "../../../build/typing";
import {
  findVersion,
  buildModuleHashLookup,
  findPolyfillsPath,
  getMetroRuntimePaths,
  getReactNativePaths,
  buildModuleMap,
} from "../utils";
import path from "path";
import fs from "fs";
import logger from "../../../utlis/logger";

const PATH_SEPARATOR = path.sep;

// 缓存文件到ID的映射关系
let cachedFileToIdMap: Map<string, number>;

/**
 * 模块处理结果接口
 */
interface ProcessModuleCommonResult {
  /** 标准化后的模块路径 */
  normalizedPath: string;
  /** 模块版本号 */
  version: string;
  /** 如果在common bundle中找到，则返回common模块信息 */
  commonModule?: any;
  /** 是否需要对本地包进行hash验证，用于检测版本相同但内容变化的情况 */
  useHashVerify?: boolean;
  /** 文件内容的hash值 */
  fileHash?: string;
  /** hash到ID的映射表 */
  hashToIdMap?: Record<string, number>;
}
/**
 * 通用的模块处理逻辑
 * 根据metaConfig是否有版本字段来决定使用新逻辑还是旧逻辑
 * @param modulePath 模块相对路径
 * @param fullPath 模块完整路径
 * @param basePath 项目根路径
 * @param moduleHashLookup 模块hash查找表
 * @param metaConfig 元数据配置
 * @param hashCache 文件hash缓存
 * @returns 模块处理结果
 */
function processModuleCommon(
  modulePath: string,
  fullPath: string,
  basePath: string,
  moduleHashLookup: Record<string, Record<string, number>>,
  metaConfig: MetaConfig,
  hashCache: Map<string, string>
): ProcessModuleCommonResult {
  // 如果metaConfig里面没有版本字段，则用之前的逻辑（兼容旧版本）
  if (!metaConfig.version) {
    // 旧逻辑：直接使用模块路径查找common模块
    const common = metaConfig.modules[modulePath];
    const version = common && findVersion(modulePath, basePath);

    return {
      normalizedPath: modulePath,
      version: version || "",
      // 只有版本匹配时才认为可以使用common模块
      commonModule: common && common.version === version ? common : undefined,
    };
  }

  // 有版本字段则使用新的逻辑（支持hash验证）
  const normalizedPath = modulePath.replace(
    /^.*node_modules\//,
    "node_modules/"
  );

  // 如果在hash查找表中没有找到该模块，说明不需要特殊处理
  if (!moduleHashLookup[normalizedPath]) {
    return {
      normalizedPath,
      version: "",
    };
  }

  const version = findVersion(modulePath, basePath);
  const commonModule = metaConfig.modules[`${normalizedPath}@${version}`];

  if (commonModule) {
    return {
      normalizedPath,
      version,
      commonModule,
    };
  }

  return {
    normalizedPath,
    version,
  };
}

/**
 * 创建模块ID工厂函数
 */
function createModuleIdFactory(
  basePath: string,
  moduleHashLookup: Record<string, Record<string, number>>,
  metaConfig: MetaConfig,
  fileToIdMap: Map<string, number>,
  nextModuleId: { value: number },
  hashCache: Map<string, string>
) {
  return (fullPath: string) => {
    const relativePath = fullPath.replace(basePath + "/", "");

    const result = processModuleCommon(
      relativePath,
      fullPath,
      basePath,
      moduleHashLookup,
      metaConfig,
      hashCache
    );

    // 如果找到了common模块，直接返回其ID
    if (result.commonModule) {
      return result.commonModule.id;
    }

    // 新逻辑：检查本地包的hash，用于处理版本相同但内容变化的情况
    if (result.useHashVerify && result.hashToIdMap && result.fileHash) {
      if (result.hashToIdMap[result.fileHash]) {
        return result.hashToIdMap[result.fileHash];
      }
    }

    // 分配新的模块ID
    let moduleId = fileToIdMap.get(relativePath);
    if (typeof moduleId !== "number") {
      moduleId = nextModuleId.value++;
      fileToIdMap.set(relativePath, moduleId);
    }
    return moduleId;
  };
}

/**
 * 创建模块过滤器
 */
function createModuleFilter(
  basePath: string,
  moduleHashLookup: Record<string, Record<string, number>>,
  metaConfig: MetaConfig,
  dependencyKeys: string[],
  hashCache: Map<string, string>
) {
  return (module: { path: string }) => {
    let modulePath = module.path.replace(basePath + "/", "");
    if (basePath.endsWith("/example")) {
      modulePath = modulePath.replace(
        basePath.replace("/example", "") + "/",
        ""
      );
    }

    const result = processModuleCommon(
      modulePath,
      module.path,
      basePath,
      moduleHashLookup,
      metaConfig,
      hashCache
    );

    // 如果找到了common模块，过滤掉
    if (result.commonModule) {
      return false;
    }

    // 新逻辑：检查本地包的hash，用于处理版本相同但内容变化的情况
    if (result.useHashVerify && result.hashToIdMap && result.fileHash) {
      if (result.hashToIdMap[result.fileHash]) {
        return false; // 已存在相同hash的模块，过滤掉
      }
    }

    // 检查版本一致性，只检测原生包
    const packageName = modulePath.split(PATH_SEPARATOR)[0];
    if (
      dependencyKeys.some((key) => key.split(PATH_SEPARATOR)[0] === packageName)
    ) {
      logger.error(
        `版本号不一致 ${modulePath} 基线版本: ${result.commonModule?.version} 本地版本: ${result.version}`
      );
    }

    // 过滤特定模块（仅限新版本应用）
    if (
      [
        "__prelude__",
        "node_modules/metro-runtime/src/polyfills/require.js",
      ].includes(modulePath) &&
      !metaConfig.useOldApp
    ) {
      return false;
    }

    return true;
  };
}

/**
 * 生成业务包的Metro配置
 * @param basePath 项目根路径
 * @param metaConfig 元数据配置
 * @param enableHMR 是否启用热更新
 * @param dependencies 依赖列表
 * @param platform 目标平台
 */
export function generateBusinessBundleConfig(
  basePath: string,
  metaConfig: MetaConfig,
  enableHMR = false,
  dependencies: Record<string, string> = {},
  platform?: Platform
): () => InputConfigT {
  const nextModuleId = { value: metaConfig.id + 1e5 };
  const fileToIdMap = enableHMR ? cachedFileToIdMap : new Map<string, number>();
  cachedFileToIdMap = fileToIdMap;

  const polyfillsPath = findPolyfillsPath(basePath);
  const dependencyKeys = Object.keys(dependencies);
  const hashCache = new Map<string, string>();
  const moduleHashLookup = buildModuleHashLookup(metaConfig);

  const metroRuntimePaths = getMetroRuntimePaths(basePath);
  const reactNativePaths = getReactNativePaths(basePath, platform);

  return (): InputConfigT => {
    const config: InputConfigT = {
      serializer: {
        polyfillModuleNames: [metroRuntimePaths.requirePolyfill],

        createModuleIdFactory: () =>
          createModuleIdFactory(
            basePath,
            moduleHashLookup,
            metaConfig,
            fileToIdMap,
            nextModuleId,
            hashCache
          ),

        processModuleFilter: createModuleFilter(
          basePath,
          moduleHashLookup,
          metaConfig,
          dependencyKeys,
          hashCache
        ),

        getModulesRunBeforeMainModule: () =>
          metaConfig.useOldApp ? [reactNativePaths.initializeCore] : [],

        getPolyfills: () =>
          (metaConfig.useOldApp
            ? (require(polyfillsPath) as () => string[])()
            : []
          ).concat(
            platform === Platform.Harmony
              ? path.resolve(
                  basePath,
                  "node_modules/@xrnjs/cli/lib/build/bundle/core/polyfills.js"
                )
              : []
          ),
      },
      transformer: {
        asyncRequireModulePath: metroRuntimePaths.asyncRequire,
      },
      resolver: {
        emptyModulePath: metroRuntimePaths.emptyModule,
      },
    };

    return config;
  };
}

/**
 * 生成通用包的Metro配置
 * @param basePath 项目根路径
 * @param platform 目标平台
 */
export function generateCommonBundleConfig(
  basePath: string,
  platform: Platform
): () => InputConfigT {
  const nextModuleId = { value: 0 };
  const fileToIdMap = new Map<string, number>();

  const metroRuntimePaths = getMetroRuntimePaths(basePath);
  const reactNativePaths = getReactNativePaths(basePath, platform);

  return (): InputConfigT => {
    const config: InputConfigT = {
      serializer: {
        polyfillModuleNames: [metroRuntimePaths.requirePolyfill],

        getModulesRunBeforeMainModule: () => [reactNativePaths.initializeCore],

        getPolyfills: () => {
          // React Native 0.72.5 依赖 @react-native/js-polyfills
          const polyfillsModule =
            require(reactNativePaths.jsPolyfills) as () => string[];
          return polyfillsModule();
        },

        createModuleIdFactory: () => {
          return (filePath: string) => {
            let moduleId = fileToIdMap.get(filePath);
            if (typeof moduleId !== "number") {
              moduleId = nextModuleId.value++;
              fileToIdMap.set(filePath, moduleId);
            }
            return moduleId;
          };
        },

        processModuleFilter: (() => {
          let debounceTimer: NodeJS.Timeout = null;

          return () => {
            // 防抖处理，避免频繁生成meta文件
            if (debounceTimer) {
              clearTimeout(debounceTimer);
            }

            debounceTimer = setTimeout(() => {
              const metaFilePath = path.resolve(
                basePath,
                `${platform}.meta.json`
              );
              logger.info(`生成 ${metaFilePath}`);

              buildModuleMap(fileToIdMap, basePath)
                .then((moduleMap) => {
                  fs.writeFileSync(
                    metaFilePath,
                    JSON.stringify(
                      {
                        modules: moduleMap,
                        id: nextModuleId.value,
                      },
                      null,
                      2
                    )
                  );
                })
                .catch((error) => {
                  logger.error(`生成meta文件失败: ${error}`);
                });
            }, 2000);

            return true;
          };
        })(),
      },
      transformer: {
        asyncRequireModulePath: metroRuntimePaths.asyncRequire,
      },
      resolver: {
        emptyModulePath: metroRuntimePaths.emptyModule,
      },
    };

    return config;
  };
}
