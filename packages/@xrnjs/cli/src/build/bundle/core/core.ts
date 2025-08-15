import type { ConfigLoadingContext } from "@react-native-community/cli-plugin-metro";
import type { BuildBundleConfig } from "../interface";
import type { InputConfigT } from "metro-config";
import { buildBundleWithConfig } from "@react-native-community/cli-plugin-metro/build/commands/bundle/buildBundle";
import { getDefaultConfig } from "@react-native/metro-config";
import { loadConfig, mergeConfig, resolveConfig } from "metro-config";
import { EntryFileName } from "../constant";
import path from "path";
import loadReactNativeConfig from "@react-native-community/cli-config";
import logger from "../../../utlis/logger";
import { Platform } from "../../../build/typing";
import { buildHarmonyBundle } from "./harmony";

export interface ConfigOptionsT {
  maxWorkers?: number;
  port?: number;
  projectRoot?: string;
  resetCache?: boolean;
  watchFolders?: string[];
  sourceExts?: string[];
  reporter?: any;
  config?: string;
}

export async function loadMetroConfig(
  ctx: ConfigLoadingContext,
  options: ConfigOptionsT,
  metroConfig?: InputConfigT
): Promise<any> {
  const defaultConfig = getDefaultConfig(ctx.root);

  const resolvedConfigResults = await resolveConfig(null, ctx.root); // 获取项目本身的metro配置
  const { config: configModule } = resolvedConfigResults;
  let resultedConfig: any = configModule;
  if (typeof configModule === "function") {
    resultedConfig = await configModule(defaultConfig);
  }
  if (resultedConfig && resultedConfig.serializer && metroConfig.serializer) {
    for (const key in metroConfig.serializer) {
      if (resultedConfig.serializer[key]) {
        // TODO 在拆包稳定后需要去掉
        logger.warn(`自定义 serializer.${key} 会被覆盖`);
        // throw new Error(`不允许自定义 serializer.${key}`);
      }
    }
  }

  const config = await loadConfig(
    { cwd: ctx.root, ...options },
    mergeConfig(defaultConfig, {
      resetCache: true,
      // resolver: {
      //   useWatchman: !isCI, // 如果运行在 ci 环境中则不要用 watchman
      // },
    })
  );

  return metroConfig ? mergeConfig(config, metroConfig) : config;
}

export async function buildBundle({
  platform,
  bundleName,
  output,
  basePath,
  metroConfig,
  sourcemapOutput,
  assetsDest = output,
  dev,
}: BuildBundleConfig) {
  const nativeConfig = loadReactNativeConfig(basePath);
  const config = await loadMetroConfig(
    nativeConfig,
    { projectRoot: basePath, resetCache: true },
    metroConfig
  );
  // TODO 功能内聚到不同的平台实现
  if (platform === Platform.Harmony) {
    await buildHarmonyBundle({
      dev: dev === "1",
      entryFile: path.resolve(basePath, EntryFileName),
      bundleOutput: path.join(output, bundleName),
      assetsDest: assetsDest,
      sourcemapOutput: path.join(
        sourcemapOutput || output,
        `${bundleName}.map`
      ),
      minify: dev !== "1",
      config: config
    });
    return;
  }
  await buildBundleWithConfig(
    {
      verbose: true,
      entryFile: path.resolve(basePath, EntryFileName),
      resetCache: true,
      platform: platform,
      resetGlobalCache: true,
      dev: dev === "1",
      minify: dev !== "1",
      bundleOutput: path.join(output, bundleName),
      sourcemapUseAbsolutePath: false,
      generateStaticViewConfigs: true,
      sourcemapOutput: path.join(
        sourcemapOutput || output,
        `${bundleName}.map`
      ),
      assetsDest: assetsDest,
    },
    config
  );
}
