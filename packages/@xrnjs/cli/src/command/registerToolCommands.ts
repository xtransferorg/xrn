import { Command } from "commander";
import { buildBusinessBundle } from "../build/bundle/buildBusinessBundle";
import { readAppJsonFile } from "../utlis/readAppJsonFile";
import { getBundleName, getBundleMapName } from "../build/bundle/utils";
import { execInherit } from "../build/utils/shell";
import { BaseLineFileType } from "../build/BaselineManager";
import { buildCommonBundle } from "../build/bundle/buildCommonBundle";
import { BaselineManagerFactory } from "../build/BaselineManagerFactory";
import fsExtra from "fs-extra";
import { BuildEnv, BuildType, Platform } from "../build/typing";
import logger from "../utlis/logger";
import path from "path";
import { COMMON_BASE_KEY } from "../codePush/diff";
import { init as initCodePushSdk } from "@xrnjs/code-push-cli";
import { DEFAULT_META_CONFIG } from "../build/constants/meta";
import { MetaConfig } from "../build/bundle/interface";
import { copyBuildBundleArtifactsToNativeRoot, writeCommonBundleDebugManifest } from "./utils";
import { checkBundleDependencies } from "../build/utils/bundleDependencies";
import { checkXtRnCoreVersion } from "../utlis/checkDependenciesInRange";

export function registerToolCommands(program: Command) {
  program
    .command("validate-bundle")
    .argument("<platform>", "iOS/android/harmony")
    .argument("<version>", "APP版本号")
    .option("--env [env]", "环境", "sitxt1")
    .option("--bundleName [bundleName]", "bundle 名称，默认读取 app.json 的 name")
    .option("--skipXtRnCoreVersion", "跳过 @xrnjs/core 版本校验", false)
    .option("--skipNativeDep", "跳过原生依赖校验", false)
    .description("下载基线并校验 bundle 依赖")
    .action(
      async (
        platform: Platform,
        version: string,
        options: {
          env: BuildEnv;
          bundleName?: string;
          skipXtRnCoreVersion?: boolean;
          skipNativeDep?: boolean;
        }
      ) => {
        initCodePushSdk();
        const { env, skipXtRnCoreVersion = false, skipNativeDep = false } = options;
        const { name: appName } = await readAppJsonFile(process.cwd());
        const bundleName = options.bundleName || appName;
        const packageJson = fsExtra.readJSONSync(
          path.join(process.cwd(), "package.json")
        );
        logger.info(
          `开始 bundle 校验 - 平台: ${platform}, 版本: ${version}, 环境: ${env}, bundle: ${bundleName}`
        );

        try {
          const baselineManager = BaselineManagerFactory.createOrGet({
            platform,
            version,
            buildEnv: env,
            buildType: BuildType.RELEASE,
          });
          baselineManager.cleanBaselineDir();
          await baselineManager.downloadFiles({
            file_types: [BaseLineFileType.META, BaseLineFileType.NATIVE_SIGNATURE],
          });

          const jsonPath = baselineManager.baseRepoManage().pkg.get();
          if (!fsExtra.existsSync(jsonPath)) {
            throw new Error("基线中, 不存在 native 的 package.json 文件");
          }

          const baselinePkg = require(jsonPath) as {
            nativeDeps?: Record<string, any>;
            reactNativeConfigDeps?: Record<string, any>;
            dependencies?: Record<string, string>;
          };

          if (!skipNativeDep) {
            const nativeDeps = baselinePkg.nativeDeps;
            const reactNativeConfigDeps = baselinePkg.reactNativeConfigDeps;
            const dependencies = baselinePkg.dependencies;

            if (!nativeDeps) {
              throw new Error("基线中不存在完整的原生依赖信息");
            }

            const checkError = await checkBundleDependencies({
              bundlePath: process.cwd(),
              bundleName,
              nativeDeps,
              platform,
              reactNativeConfigDeps,
              checkLevel: "minor",
              allowNewPackage: false,
              allowBundleVersionLowerThanNative: false,
              dependencies,
            });
            if (checkError) {
              throw new Error(`校验 ${bundleName} 依赖失败`);
            }
          }

          if (!skipXtRnCoreVersion) {
            checkXtRnCoreVersion({
              appVersion: version,
              bundleName,
              projectPath: process.cwd(),
            });
          }

          logger.info("bundle 校验完成");
        } catch (error) {
          logger.error(
            "bundle 校验失败:",
            error instanceof Error ? error.message : JSON.stringify(error)
          );
          process.exit(1);
        }
      }
    );

  program
    .command("build-bundle")
    .argument("<platform>", "iOS/android/harmony")
    .option("--appVersion <appVersion>", "应用版本号")
    .option("--env <env>", "环境信息，比如 staging、prod、sitxt1...", "sitxt1")
    .option("--buildType <buildType>", "打包类型 debug/release", BuildType.DEBUG)
    .option("--hermes <hermes>", "是否启用 Hermes 编译，true 或 false", "false")
    .option("--analyze", "构建完成后使用 source-map-explorer 分析产物", false)
    .option(
      "--nativeRoot <nativeRoot>",
      "原生工程根目录，传入后会将构建产物复制到原生目录"
    )
    .action(
      async (
        platform: Platform,
        options: {
          env: BuildEnv;
          appVersion: string;
          analyze?: boolean;
          buildType: BuildType;
          hermes?: string;
          nativeRoot?: string;
        }
      ) => {
        initCodePushSdk();
        const normalizedBuildType = String(options.buildType || "")
          .toLowerCase()
          .trim() as BuildType;
        if (
          normalizedBuildType !== BuildType.DEBUG &&
          normalizedBuildType !== BuildType.RELEASE
        ) {
          throw new Error(
            `不支持的 buildType: ${options.buildType}，仅支持 debug/release`
          );
        }
        const { name } = await readAppJsonFile(process.cwd());
        const metaPath = path.join(process.cwd(), "meta.json");
        const hasMeta = fsExtra.existsSync(metaPath);
        let meta: MetaConfig = DEFAULT_META_CONFIG;
        if (hasMeta) {
          logger.info(`meta.json 文件存在，使用 meta.json 中的内容`);
          meta = require(metaPath);
        } else if (options.appVersion) {
          logger.info(
            `版本号 ${options.appVersion} 存在，使用基线文件中的内容`
          );
          const baselineManager = BaselineManagerFactory.createOrGet({
            platform,
            version: options.appVersion,
            buildEnv: options.env,
            buildType:
              normalizedBuildType === BuildType.DEBUG
                ? BuildType.DEBUG
                : BuildType.RELEASE,
          });
          baselineManager.cleanBaselineDir();
          await baselineManager.downloadFiles({
            file_types: [BaseLineFileType.META],
          });
          const pkgJson = require(baselineManager.baseRepoManage().pkg.get());
          meta = pkgJson[COMMON_BASE_KEY];
        } else {
          logger.info(
            `版本号 ${options.appVersion} 不存在，使用默认配置，构建全量包`
          );
          meta = DEFAULT_META_CONFIG;
        }

        const assetsDestMap: Record<Platform, string> = {
          [Platform.iOS]: `${process.cwd()}/release_${platform}/`,
          [Platform.Android]: `${process.cwd()}/release_${platform}/res/`,
          [Platform.Harmony]: `${process.cwd()}/release_${platform}/assets/assets`,
        };
        const assetsDest = assetsDestMap[platform];

        fsExtra.ensureDirSync(path.join(process.cwd(), `release_${platform}`));
        await buildBusinessBundle({
          platform,
          name,
          env: options.env,
          root: process.cwd(),
          output: `release_${platform}`,
          assetsDest,
          meta,
          dev: normalizedBuildType === BuildType.DEBUG,
          hermes: (options.hermes || "true") === "true",
        });

        if (options.nativeRoot) {
          const bundleOutputPath = path.join(process.cwd(), `release_${platform}`);
          const nativeRootPath = path.resolve(process.cwd(), options.nativeRoot);
          logger.info(`开始复制构建产物到原生目录: ${nativeRootPath}`);
          await copyBuildBundleArtifactsToNativeRoot(
            platform,
            name,
            getBundleName(platform, name),
            getBundleMapName(platform, name),
            bundleOutputPath,
            nativeRootPath
          );
          logger.info(`构建产物复制完成: ${nativeRootPath}`);
        }

        // 输出构建产物 JS 文件大小
        const bundleFileName = getBundleName(platform, name);
        const bundleFilePath = path.join(
          process.cwd(),
          `release_${platform}`,
          bundleFileName
        );
        if (fsExtra.existsSync(bundleFilePath)) {
          const stats = fsExtra.statSync(bundleFilePath);
          const fileSizeInBytes = stats.size;
          const fileSizeInKB = (fileSizeInBytes / 1024).toFixed(2);
          const fileSizeInMB = (fileSizeInBytes / (1024 * 1024)).toFixed(2);
          logger.info(
            `构建完成！产物 JS 文件大小: ${fileSizeInBytes} 字节 (${fileSizeInKB} KB / ${fileSizeInMB} MB)`
          );
          logger.info(`文件路径: ${bundleFilePath}`);
        } else {
          logger.warn(`构建产物文件不存在: ${bundleFilePath}`);
        }

        // 如果设置了 --analyze 参数，执行 source-map-explorer 分析
        if (options.analyze) {
          const bundleMapFileName = getBundleMapName(platform, name);
          const bundleMapFilePath = path.join(
            process.cwd(),
            `release_${platform}`,
            bundleMapFileName
          );

          if (
            fsExtra.existsSync(bundleFilePath) &&
            fsExtra.existsSync(bundleMapFilePath)
          ) {
            logger.info(`开始分析构建产物...`);
            const analyzeCommand = `npx source-map-explorer "${bundleFilePath}" "${bundleMapFilePath}"`;
            await execInherit(analyzeCommand);
          } else {
            logger.warn(
              `无法进行分析：构建产物文件不存在: ${bundleFilePath} 或 source map 文件不存在: ${bundleMapFilePath}`
            );
          }
        }
      }
    );

  program
    .command("build-common-bundle")
    .argument("<platform>", "iOS/android/harmony")
    .option("--env <env>", "环境信息，比如 staging、prod、sitxt1...", "sitxt1")
    .option("--buildType <buildType>", "打包类型 debug release", "release")
    .option("--hermes <hermes>", "是否启用 Hermes 编译，true 或 false", "false")
    .option("--analyze", "构建完成后使用 source-map-explorer 分析产物", false)
    .option("-e --verbose [verbose]", "调试模式", false)
    .option(
      "--nativeRoot <nativeRoot>",
      "原生工程根目录，传入后会将构建产物复制到原生目录"
    )
    .description("构建 common bundle")
    .action(
      async (
        platform: Platform,
        options: {
          env: BuildEnv;
          buildType: BuildType;
          verbose: boolean;
          hermes?: string;
          analyze?: boolean;
          nativeRoot?: string;
        }
      ) => {
        const { env, buildType, verbose } = options;

        logger.info(JSON.stringify(options));

        const metaJson = await buildCommonBundle({
          platform,
          verbose,
          buildType,
          buildEnv: env,
          base: process.cwd(),
          hermes: (options.hermes || "true") === "true",
        });

        logger.info(`Common bundle 构建完成`);

        const nativeRootPath = path.resolve(
          process.cwd(),
          options.nativeRoot ?? "."
        );
        if (options.nativeRoot) {
          await writeCommonBundleDebugManifest(
            platform,
            process.cwd(),
            metaJson,
            buildType,
            env,
            nativeRootPath
          );
          const bundleOutputPath = path.join(
            process.cwd(),
            "xt-app-common",
            `release_${platform}`
          );
          logger.info(`开始复制构建产物到原生目录: ${nativeRootPath}`);
          await copyBuildBundleArtifactsToNativeRoot(
            platform,
            "xt-app-common",
            getBundleName(platform),
            getBundleMapName(platform),
            bundleOutputPath,
            nativeRootPath
          );
          logger.info(`构建产物复制完成: ${nativeRootPath}`);
        }

        if (options.analyze) {
          const commonRoot = path.join(process.cwd(), "xt-app-common");
          const bundleFileName = getBundleName(platform);
          const bundleFilePath = path.join(
            commonRoot,
            `release_${platform}`,
            bundleFileName
          );
          const bundleMapFileName = getBundleMapName(platform);
          const bundleMapFilePath = path.join(
            commonRoot,
            `release_${platform}`,
            bundleMapFileName
          );

          if (
            fsExtra.existsSync(bundleFilePath) &&
            fsExtra.existsSync(bundleMapFilePath)
          ) {
            logger.info(`开始分析构建产物...`);
            const analyzeCommand = `npx source-map-explorer "${bundleFilePath}" "${bundleMapFilePath}"`;
            await execInherit(analyzeCommand);
          } else {
            logger.warn(
              `无法进行分析：构建产物文件不存在: ${bundleFilePath} 或 source map 文件不存在: ${bundleMapFilePath}`
            );
          }
        }
      }
    );
  }
