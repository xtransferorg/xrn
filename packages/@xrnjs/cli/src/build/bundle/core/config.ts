import type { InputConfigT } from "metro-config";
import type { MetaConfig } from "../interface";
import { Platform } from "../../../build/typing";
import { findVersion } from "../utils";
import path from "path";
import fs from "fs";
import logger from "../../../utlis/logger";
const packageName = require('../../../../package.json').name
const sep = path.sep

let cacheFileToIdMap: Map<string, number>;
export function generateBusiness(
  basePath: string,
  metaJson: MetaConfig,
  hmr = false,
  dependencies: Record<string, string> = {},
  platform?: Platform
) {
  let nextId = metaJson.id + 1e5;
  const fileToIdMap = hmr ? cacheFileToIdMap : new Map<string, number>();
  cacheFileToIdMap = fileToIdMap;

  let polyfills = path.resolve(
    basePath,
    "node_modules/@react-native/js-polyfills/index.js"
  );
  if (!fs.existsSync(polyfills)) {
    polyfills = path.resolve(
      basePath,
      "node_modules/@react-native/polyfills/index.js"
    );
  }
  const dependenciesKeys = Object.keys(dependencies);

  return () => {
    const config: InputConfigT = {
      serializer: {
        polyfillModuleNames: [
          path.resolve(
            basePath,
            "node_modules/metro-runtime/src/polyfills/require.js"
          ),
        ],
        createModuleIdFactory: () => {
          return (p1: string) => {
            const path = p1.replace(basePath + "/", "");
            const common = metaJson.modules[path];
            const version = common && findVersion(path, basePath);

            if (common) {
              if (common.version === version) {
                return common.id;
              }
            }
            let id = fileToIdMap.get(path);
            if (typeof id !== "number") {
              id = nextId++;
              fileToIdMap.set(path, id);
            }
            return id;
          };
        },
        processModuleFilter: (module: {path: string}) => {
          const path = module.path.replace(basePath + "/", "");
          const common = metaJson.modules[path];
          const version = common && findVersion(path, basePath);

          if (common) {
            if (common.version === version) {
              return false;
            } else {
              const pkgName = path.split(sep)[1];
              if (dependenciesKeys.some((key) => key.split(sep)[0] === pkgName)) {
                logger.error(
                  `版本号不一致 ${path} 基线版本: ${common.version} 本地版本: ${version}`
                );
              }
            }
          }
          if (
            [
              "__prelude__",
              "node_modules/metro-runtime/src/polyfills/require.js",
            ].includes(path) &&
            !metaJson.useOldApp
          ) {
            return false;
          }
          return true;
        },
        getModulesRunBeforeMainModule: () =>
          metaJson.useOldApp
            ? [
                path.resolve(
                  basePath,
                  "node_modules/react-native/Libraries/Core/InitializeCore.js"
                ),
              ]
            : [],
        getPolyfills: () =>
          (metaJson.useOldApp
            ? (require(polyfills) as () => string[])()
            : []
          ).concat(platform === Platform.Harmony ? path.resolve(basePath, 'node_modules', packageName, 'lib/build/bundle/core/polyfills.js') : []),
      },
      transformer: {
        asyncRequireModulePath: path.resolve(
          basePath,
          "node_modules/metro-runtime/src/modules/asyncRequire.js"
        ),
      },
      resolver: {
        emptyModulePath: path.resolve(
          basePath,
          "node_modules/metro-runtime/src/modules/empty-module.js"
        ),
      },
    };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return config;
  };
}

export function generateCommon(basePath: string, platform: Platform) {
  let nextId = 0;
  const fileToIdMap = new Map<string, number>();

  return () => {
    const config: InputConfigT = {
      serializer: {
        polyfillModuleNames: [
          path.resolve(
            basePath,
            "node_modules/metro-runtime/src/polyfills/require.js"
          ),
        ],
        getModulesRunBeforeMainModule: () => [
          path.resolve(
            basePath,
            "node_modules/react-native/Libraries/Core/InitializeCore.js"
          ),
        ],
        getPolyfills: () =>
          // React Native 0.72.5 依赖 @react-native/js-polyfills
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          (require(path.resolve(
            basePath,
            "node_modules/@react-native/js-polyfills"
          )) as () => any)(),
        createModuleIdFactory: () => {
          return (path: string) => {
            let id = fileToIdMap.get(path);
            if (typeof id !== "number") {
              id = nextId++;
              fileToIdMap.set(path, id);
            }
            return id;
          };
        },
        processModuleFilter: (() => {
          let timeId: NodeJS.Timeout = null;
          return () => {
            timeId && clearTimeout(timeId);
            timeId = setTimeout(() => {
              const metaPathName = path.resolve(
                basePath,
                `${platform}.meta.json`
              );
              logger.info(`生成 ${metaPathName}`);
              const modules = [...fileToIdMap].reduce((acc, [key, value]) => {
                key = key.replace(/^\/private/, "").replace(basePath + "/", "");
                const version = findVersion(key, basePath);
                if (!/^node_modules/.test(key)) {
                  return acc;
                }

                acc[key] = {
                  id: value,
                  version: version || "0.0.0",
                };
                return acc;
              }, {});
              fs.writeFileSync(
                metaPathName,
                JSON.stringify({
                  modules: modules,
                  id: nextId,
                })
              );

              // 输出 meta.json 后退出进程
              process.exit(0);
            }, 2000);
            return true;
          };
        })(),
      },
      transformer: {
        asyncRequireModulePath: path.resolve(
          basePath,
          "node_modules/metro-runtime/src/modules/asyncRequire.js"
        ),
      },
    };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return config;
  };
}
