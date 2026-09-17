import type { Config } from "@react-native-community/cli-types";
import type { BuildBundleConfig } from "../interface";
import type { InputConfigT } from "metro-config";
import { buildBundleWithConfig } from "./buildBundle";
import { getDefaultConfig } from "@react-native/metro-config";
import { loadConfig, mergeConfig, resolveConfig } from "metro-config";
import { EntryFileName } from "../constant";
import path from "path";
import loadReactNativeConfig from "@react-native-community/cli-config";
import logger from "../../../utlis/logger";
import { Platform } from "../../../build/typing";
import { buildHarmonyBundle } from "./harmony";
import { execInherit } from "../../utils/shell";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error 这个包没有这个函数的类型定义，但是有具体的实现
import { composeSourceMaps } from "metro-source-map";
import fs from "fs";
import os from "os";

export interface ConfigOptionsT {
  maxWorkers?: number;
  port?: number;
  projectRoot?: string;
  resetCache?: boolean;
  watchFolders?: string[];
  sourceExts?: string[];
  reporter?: any;
  config?: string;
  [key: string]: any;
}

export async function loadMetroConfig(
  ctx: Config,
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
  rootPath = basePath,
  metroConfig,
  sourcemapOutput,
  assetsDest = output,
  dev,
  hermes = "1",
  baseBytecodeFilePath,
}: BuildBundleConfig) {
  const nativeConfig = loadReactNativeConfig({ projectRoot: rootPath });
  const config = await loadMetroConfig(
    nativeConfig,
    { projectRoot: rootPath, resetCache: true },
    metroConfig
  );
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
      config: config,
    });
    if (hermes === "1") {
      await compileWithHermes({
        output,
        bundleName,
        sourcemapOutput,
        rootPath,
        baseBytecodeFilePath,
      });
    } else {
      logger.info("未启用 Hermes，跳过 Hermes 编译");
    }
    return;
  }
  await buildBundleWithConfig(
    {
      entryFile: path.resolve(basePath, EntryFileName),
      resetCache: true,
      platform: platform,
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
  if (hermes === "1") {
    await compileWithHermes({
      output,
      bundleName,
      sourcemapOutput,
      rootPath,
      baseBytecodeFilePath,
    });
  } else {
    logger.info("未启用 Hermes，跳过 Hermes 编译");
  }
}

async function compileWithHermes({
  output,
  bundleName,
  sourcemapOutput,
  rootPath,
  baseBytecodeFilePath,
}: {
  output: string;
  bundleName: string;
  sourcemapOutput?: string;
  rootPath: string;
  baseBytecodeFilePath?: string;
}) {
  // 先读取 Metro 生成的 sourcemap 文件，因为 Hermes 编译后会生成新的 sourcemap 文件，我们需要把 Metro 的 sourcemap 和 Hermes 的 sourcemap 进行组合，才能正确映射到源码
  const sourceMapFile = path.join(
    sourcemapOutput || output,
    `${bundleName}.map`
  );
  const packagerSourceMap = JSON.parse(fs.readFileSync(sourceMapFile, "utf8"));
  // 兼容 macOS 和 Linux
  let hermesBinDir = "osx-bin";
  if (os.platform() === "linux") {
    hermesBinDir = "linux64-bin";
  }
  const hermes = path.resolve(
    rootPath,
    `node_modules/react-native/sdks/hermesc/${hermesBinDir}/hermesc`
  );
  logger.info(`Hermes 编译器路径: ${hermes}`);
  const baseBytecodeArg =
    baseBytecodeFilePath && fs.existsSync(baseBytecodeFilePath)
      ? ` -base-bytecode ${baseBytecodeFilePath}`
      : "";
  if (baseBytecodeFilePath && !fs.existsSync(baseBytecodeFilePath)) {
    logger.warn(`[HBC_BASELINE] 指定的 base-bytecode 文件不存在，将跳过该参数: ${baseBytecodeFilePath}`);
  }
  const command = `${hermes} -w -emit-binary -O -output-source-map${baseBytecodeArg} -out ${path.join(
    output,
    bundleName
  )} ${path.join(output, bundleName)}`;
  logger.info(`开始使用 Hermes 编译: ${command}`);
  await execInherit(command);
  logger.info(`Hermes 编译成功`);

  const hermesMapFile = path.join(output, bundleName) + ".map";
  const hbcSourceMap = JSON.parse(fs.readFileSync(hermesMapFile, "utf8"));

  // 组合 sourcemap：Metro的sourcemap映射到源码，Hermes的sourcemap映射到bundle
  const composedMap = composeSourceMaps([packagerSourceMap, hbcSourceMap]);

  fs.rmSync(sourceMapFile); // 删除 Metro 生成的中间 sourcemap 文件
  // 写入最终的 sourcemap
  fs.writeFileSync(sourceMapFile, JSON.stringify(composedMap));
  if (!bundleName.includes("xt-app-common")) {
    if (hermesMapFile === sourceMapFile) {
      logger.warn(
        `Hermes 生成的 sourcemap 文件与 Metro 生成的文件路径相同，无法删除 Hermes 生成的中间 sourcemap 文件: ${hermesMapFile}`
      );
    } else {
      logger.info(`删除 Hermes 中间文件: ${hermesMapFile}`);
      fs.rmSync(hermesMapFile); // 删除 Hermes 生成的中间 sourcemap 文件
    }
  }
  logger.info(`Sourcemap 组合完成: ${sourceMapFile}`);
}
