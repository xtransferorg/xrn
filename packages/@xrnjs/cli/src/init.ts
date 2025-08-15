#!/usr/bin/env node

import bundleCommand from "@react-native-community/cli-plugin-metro/build/commands/bundle/bundleCommandLineArgs";
import startCommand from "@react-native-community/cli-plugin-metro/build/commands/start";
import { Command } from "commander";
import path from "path";

import { build } from "./build";
import { buildJobContext } from "./build/BuildJobContext";
import { buildBundle } from "./build/bundle/adapter";
import { buildBusinessBundle } from "./build/bundle/buildBusinessBundle";
import { DEFAULT_META_CONFIG } from "./build/constants/meta";
import { BuildEnv, BuildCommandOptions, Platform } from "./build/typing";
import { execShellCommand } from "./build/utils/shell";
import { createBaseLineManager } from "./codePush/baselineManager";
import { grayRelease } from "./codePush/grayRelease";
import { codePush } from "./codePush/init";
import {
  rollback,
  rollbackByChannelReleaseId,
  rollbackByUuid,
} from "./codePush/rollback";
import { getCodePushKeyName } from "./codePush/utils";
import { appPublish } from "./publish";
import { publishJobContext } from "./publish/PublishJobContext";
import { PublishCommandOptions } from "./publish/publishTypes";
import { appRollout } from "./rollout";
import { AppRolloutOptions } from "./rollout/types";
import { runApp } from "./startApp";
import { startAppContext } from "./startApp/StartAppContext";
import { installApp } from "./startApp/installApp";
import { DeviceType, XrnOptions, XrnStartArgs } from "./startApp/types";
import logger from "./utlis/logger";
import { readAppJsonFile } from "./utlis/readAppJsonFile";

const version = require("../package.json").version;

/**
 * Main CLI program instance using Commander.js
 * Defines all available commands and their options for the XRN CLI tool
 */
export const program = new Command();

program.version(version, "-v, --version");

/**
 * Build command for creating app packages
 * Handles the complete build process for iOS, Android, and Harmony platforms
 */
program
  .command("build <project>")
  .argument("<platform>", "iOS和android、harmony")
  .option("--env <env>", "环境", "dev")
  .option("-p --appPath <appPath>", "app相对仓库的路径，兼容多包仓库场景", "")
  .option("-t --type <buildType>", "设置打包类型debug release", "release")
  .option("-b --bundleBranch <bundleBranch>", "设置bundle打包分支", "main")
  .option("-c --channel <channel>", "打包渠道", "")
  .option("-f  --appFormat <appFormat>", "App包格式", "apk")
  .option("-s --sec <sec>", "设置加固", "false")
  .option("-d --dsym <dsym>", "符号表输出", "false")
  .option("-sim --iosSimulator <iosSimulator>", "iOS模拟器打包", "false")
  .option("-e --verbose [verbose]", "调试模式", false)
  .option("--cleanWatchMan [cleanWatchMan]", "调试模式", false)
  .option("--skipBundle [skipBundle]", "跳过bundle打包", false)
  .option("--skip [skip]", "跳过原生打包", false)
  .option(
    "--shouldFirstCodePush <shouldFirstCodePush>",
    "是否发布热更新",
    "false",
  )
  .option("--privateKey <privateKey>", "密钥地址")
  .allowUnknownOption(true)
  .description("app 打包")
  .action(
    async (
      project: string,
      platform: Platform,
      options: BuildCommandOptions,
    ) => {
      await buildJobContext.init(project, platform, options);

      if (buildJobContext.verbose) {
        logger.debug(`当前执行路径: ${process.cwd()}`);
        logger.debug(`程序存放路径: ${__dirname}`);
      }

      buildJobContext.logInfo();

      if (buildJobContext.cleanWatchMan) {
        await execShellCommand("watchman watch-del-all");
      }
      await build();
      logger.info("打包脚本，脚本结束标识V3！！！");
    },
  );

/**
 * App publish command for releasing apps
 * Combines build and publish operations for app distribution
 */
program
  .command("app-publish <project>")
  .argument("<platform>", "iOS和android")
  .option("--env <env>", "环境", "dev")
  .option("-p --appPath <appPath>", "app相对仓库的路径，兼容多包仓库场景", "")
  .option("-t --type <buildType>", "设置打包类型debug release", "release")
  .option("-b --bundleBranch <bundleBranch>", "设置bundle打包分支", "master")
  .option("-c --channel <channel>", "打包渠道", "china")
  .option("-f  --appFormat <appFormat>", "App包格式", "apk")
  .option("-s --sec <sec>", "设置加固", "false")
  .option("-d --dsym <dsym>", "符号表输出", "false")
  .option("-sim --iosSimulator <iosSimulator>", "iOS模拟器打包", "false")
  .option("-e --verbose [verbose]", "调试模式", "false")
  .option("--cleanWatchMan [cleanWatchMan]", "调试模式", false)
  .option("--updateType <updateType>", "更新类型", "force")
  .option(
    "--notOnlyApplyVersion <notOnlyApplyVersion>",
    "如果设置了此参数，表示除了此版的App都能收到本次更新",
    "",
  )
  .requiredOption("--changeLog <changeLog>", "更新日志")
  .option(
    "--isBackwardCompatible <isBackwardCompatible>",
    "是否向后兼容",
    "false",
  )
  .option("--skip [skip]", "跳过原生打包", "false")
  .option(
    "--shouldFirstCodePush <shouldFirstCodePush>",
    "是否发布热更新",
    "false",
  )
  .option("--privateKey <privateKey>", "密钥地址")
  .allowUnknownOption(true)
  .description("xt-app-rn 发布")
  .action(
    async (
      project: string,
      platform: Platform,
      options: PublishCommandOptions,
    ) => {
      if (!options.changeLog) {
        logger.error("changeLog 不能为空");
        process.exit(1);
      }
      await buildJobContext.init(project, platform, options);
      await publishJobContext.init(project, platform, options);
      publishJobContext.initPublish(options);

      if (buildJobContext.verbose) {
        logger.debug(`当前执行路径: ${process.cwd()}`);
        logger.debug(`程序存放路径: ${__dirname}`);
      }

      buildJobContext.logInfo();

      if (buildJobContext.cleanWatchMan) {
        await execShellCommand("watchman watch-del-all");
      }
      await appPublish();
    },
  );

/**
 * App rollout command for managing staged rollouts
 * Handles gradual app deployment with traffic control and whitelist management
 */
program
  .command("app-rollout")
  .description("Perform an app rollout with specified options")
  .option("-v, --versionId <string>", "灰度流量 0~100")
  .option("-r, --rollout <string>", "灰度流量 0~100")
  .option("-b, --isBackwardCompatible <string>", "是否向下兼容")
  .option("-s, --status <status>", "发布状态")
  .option("-w, --whiteList <string>", "白名单，设备id 逗号分割")
  .option("-u, --updateType <string>", "更新类型")
  .option(
    "-n, --notOnlyApplyVersion <string>",
    "如果设置了此参数，表示除了此版的App都能收到本次更新",
  )
  .action(async (options: AppRolloutOptions) => {
    // 您可以在这里处理传入的选项
    logger.debug("App Rollout Options:", options);
    await appRollout(options);
  });

/**
 * CodePush command for hot update deployment
 * Manages React Native hot updates for different platforms and environments
 */
program
  .command("codepush")
  .argument("<app>", "XDeal or XTransfer")
  .argument("<platform>", "打包平台")
  .argument("<appVersion>", "APP版本号")
  .argument("<env>", "设置打包环境 sitxt1-sitxt82 staging prod")
  .option("-b --branch <branch>", "设置bundle打包分支", "master")
  .option("-i --increment <increment>", "设置是否增量更新", "true")
  .option("-desc --desc <desc>", "更新文案", "")
  .option("-m --mandatory <mandatory>", "是否强制", "false")
  .option("--uuid <uuid>", "用于在某些平台中回滚使用。")
  .option("--rollout <rollout>", "灰度比例")
  .option("--whiteList <whiteList>", "灰度白名单")
  .option("--channelReleaseId <channelReleaseId>", "渠道发布id")
  .option("--privateKey <privateKey>", "密钥地址")
  .option("--dev <dev>", "是否开发模式", "false")
  .description("xt-app-rn 发布热更新")
  .action(async (app, platform, appVersion, env, option) => {
    const {
      branch,
      increment,
      desc,
      mandatory,
      uuid,
      rollout,
      whiteList,
      channelReleaseId,
      privateKey,
      dev,
    } = option;
    const appConfig = require(`${process.cwd()}/app.json`);
    const projectName = appConfig.name;
    const checkMissingKeys = appConfig.checkMissingKeys;
    const skipCheckXtRnCoreVersion = appConfig.skipCheckXtRnCoreVersion;
    logger.debug(`ProjectName============${app}`);
    logger.debug("--打包参数", {
      branch,
      isIncrement: increment,
      platform,
      desc,
      appVersion,
      isMandatory: mandatory,
      projectName,
      uuid,
      dev,
    });
    const isIncrement = increment === "true";
    const isDev = dev === "true";
    await codePush({
      privateKey,
      app,
      projectName,
      branch,
      isIncrement,
      platform,
      desc,
      env,
      appVersion,
      isMandatory: mandatory,
      uuid,
      rollout,
      whiteList,
      channelReleaseId,
      checkMissingKeys,
      skipCheckXtRnCoreVersion,
      isDev,
    });
  });

/**
 * Rollback command for CodePush updates
 * Allows rolling back to previous versions or specific labels
 */
program
  .command("rollback")
  .argument("<bundle>", "bundle 名称，比如 xt-app-main")
  .argument("<platform>", "系统信息，比如 IOS、Android")
  .argument("<appVersion>", "APP版本号，比如 3.2.15")
  .argument("<env>", "环境信息，比如 staging、prod、sitxt1...")
  .option("--label [label]", "设置回滚的版本")
  .option(
    "--targetUuid [targetUuid]",
    "批量回滚，用于在某些平台中回滚使用。（在发布热更新时需要携带uuid信息）",
  )
  .option(
    "--rollbackUuid [rollbackUuid]",
    "批量回滚，用于确定当前回滚后新记录的 uuid",
  )
  .option("--previous [previous]", "是否回滚到目标版本的上一个版本")
  .description("codepush 回滚")
  .action(
    async (
      bundle: string,
      platform: Platform,
      appVersion: string,
      env: string,
      option: {
        label?: string;
        targetUuid?: string;
        rollbackUuid?: string;
        previous?: boolean;
      },
    ) => {
      const { label, targetUuid, rollbackUuid, previous } = option;
      await rollback({
        bundleName: bundle,
        env,
        platform,
        appVersion,
        label,
        targetUuid,
        rollbackUuid,
        previous,
      });
    },
  );

/**
 * Install app command for device deployment
 * Installs specific app versions on target devices
 */
program
  .command("install-app")
  .description("安装指定版本的App")
  .argument("<platform>", "ios/android/harmony/ios-simulator")
  .option("--project [project]", "设置XTransfer还是其它APP", "XTransfer")
  .option("--branch [branch]", "从哪个分支拉取app包", "")
  .option(
    "--package-name [packageName]",
    "app 包名",
    "com.xtapp.xtransfer.debug",
  )
  .option(
    "--app-version [version]",
    "设置app版本号，设置为select时开启命令行交互选择版本号",
    "latest",
  )
  .option("-e --verbose [verbose]", "调试模式", false)
  .action(async (deviceType: DeviceType, options: XrnOptions) => {
    await installApp(deviceType, options);
  });

/**
 * Batch patch command for updating rollout settings
 * Modifies rollout percentages and whitelist for existing releases
 */
program
  .command("batchPatch")
  .requiredOption(
    "--channelReleaseId <channelReleaseId>",
    "用于确定哪发布单需要修改",
  )
  .option("--rollout <rollout>", "设置灰度比例")
  .option("--whiteList <whiteList>", "设置灰度白名单")
  .description("热更新灰度比例和白名单修改")
  .action(
    async (option: {
      channelReleaseId: string;
      rollout: string;
      whiteList?: string;
    }) => {
      await grayRelease({
        channelReleaseId: option.channelReleaseId,
        rollout: option.rollout,
        whiteList: option.whiteList,
      });
    },
  );

/**
 * Batch rollback command for channel-based rollbacks
 * Performs rollbacks based on channel release IDs or UUIDs
 */
program
  .command("batchRollback")
  .option("--channelReleaseId <channelReleaseId>", "用于确定哪发布单需要回滚")
  .option("--previous [previous]", "是否回滚到目标版本的上一个版本")
  .option(
    "--targetUuid [targetUuid]",
    "批量回滚，用于在某些平台中回滚使用。（在发布热更新时需要携带uuid信息）",
  )
  .option(
    "--rollbackUuid [rollbackUuid]",
    "批量回滚，用于确定当前回滚后新记录的 uuid",
  )
  .description("按照发布单回滚")
  .action(
    async (option: {
      channelReleaseId?: string;
      targetUuid?: string;
      rollbackUuid?: string;
      previous: boolean;
    }) => {
      if (option.channelReleaseId) {
        await rollbackByChannelReleaseId(
          option.channelReleaseId,
          option.previous,
        );
        return;
      }
      if (option.targetUuid && option.rollbackUuid) {
        await rollbackByUuid(
          option.targetUuid,
          option.rollbackUuid,
          option.previous,
        );
        return;
      }
      throw new Error(
        "参数错误. channelReleaseId 或者 targetUuid 和 rollbackUuid 必须有一个",
      );
    },
  );

/**
 * Add CodePush app command
 * Creates new CodePush applications for different platforms
 */
program
  .command("add-code-push-app")
  .argument("<platform>", "ios/android/harmony")
  .option("--project <project>", "设置 app", "xrngo")
  .option("--env <env>", "环境", "dev")
  .action(async (platform, { project, env }) => {
    const { name } = await readAppJsonFile(process.cwd());
    const codePushKeyName = getCodePushKeyName({
      bundleName: name,
      platform,
      buildEnv: env,
      project,
    });
    await execShellCommand(
      `code-push app add ${codePushKeyName} ${platform === "harmony" ? "oh" : platform} react-native`,
    );
  });

/**
 * Bind port command for device debugging
 * Sets up port forwarding for Android and Harmony devices
 */
program
  .command("bind-port")
  .argument("<platform>", "android/harmony")
  .action(async (platform) => {
    const { port } = await readAppJsonFile(process.cwd());
    if (platform === "android") {
      const adbReverseCommand = `adb reverse tcp:${port} tcp:${port}`;
      logger.info(
        `正在执行 adb reverse 命令: ${adbReverseCommand}，请确保设备已连接`,
      );
      await execShellCommand(adbReverseCommand);
    } else if (platform === "harmony") {
      const harmonyPortForwardCommand = `hdc rport tcp:${port} tcp:${port}`;
      logger.info(
        `正在执行 hdc rport 命令: ${harmonyPortForwardCommand}，请确保设备已连接`,
      );
      await execShellCommand(harmonyPortForwardCommand);
    }
  });

/**
 * Start command for development server
 * Extends React Native's start command with additional XRN-specific options
 */
const start = program
  .command("start")
  .alias("xrn-start")
  .description("启动服务");
startCommand.options.map((option) => {
  if (option.parse) {
    start.option(
      option.name,
      option.description,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      option.parse,
      option.default,
    );
  } else {
    start.option(option.name, option.description, option.default);
  }
});

start
  .option("--project [project]", "设置APP")
  .option(
    "--local [local]",
    "是否本地启动，用于本地打包debug时使用（一般原生同学在修改依赖后需要使用，调试完成后给业务需要打debug包，不能把本地的debug包给业务）",
    (value) => {
      return value === "true";
    },
    false,
  )
  .option("--verbose [verbose]", "调试模式", false)
  .option("--branch [branch]", "从哪个分支拉取app包", "")
  .option("--project [project]", "设置XTransfer还是其它APP", "XTransfer")
  .option("--package-name [packageName]", "app 包名")
  .option(
    "--app-version [version]",
    "设置app版本号，设置为select时开启命令行交互选择版本号",
    "latest",
  )
  .option(
    "--remote [remote]",
    "是否使用远程 app 包",
    (value) => {
      return value === "true";
    },
    false,
  )
  .option("-e --verbose [verbose]", "调试模式", false)
  .allowUnknownOption(true)
  .action(async (options: XrnStartArgs) => {
    await startAppContext.init(options);
    await runApp(options);
    // await startBusinessBundle(options);
  });

/**
 * Bundle command for building JavaScript bundles
 * Handles common and business bundle compilation
 */
const bundle = program
  .command("bundle")
  .argument("<type>", "common or biz")
  .description("构建 bundle");
bundleCommand.map((option) => {
  if (option.parse) {
    bundle.option(
      option.name,
      option.description,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      option.parse,
      option.default,
    );
  } else {
    bundle.option(option.name, option.description, option.default);
  }
});
bundle.option("-o, --output-meta-json [outputMetaJson]", "输出json文件路径");
bundle
  .requiredOption(
    "-v, --appVersion <appVersion>",
    "APP版本,用来获取 common 依赖",
    "0.0.1",
  )
  .action(async (type, options) => {
    try {
      const server = process.cwd().split(path.sep);
      const name = server[server.length - 1];
      logger.info(`构建 ${type}`, { ...options, name });
      await buildBundle({
        ...options,
        type,
        name,
      });
    } catch (error) {
      logger.error(
        error instanceof Error ? error.message : JSON.stringify(error),
      );
      process.exit(1);
    }
  });

/**
 * Build bundle command for platform-specific bundle compilation
 * Creates optimized bundles for different platforms
 */
program
  .command("build-bundle")
  .argument("<platform>", "iOS/android/harmony")
  .option("buildType <buildType>", "设置打包类型debug release", "release")
  .option("--bundlePath <bundlePath>", "bundle 路径", process.cwd())
  .action(
    async (
      platform: Platform,
      {
        bundlePath = process.cwd(),
        buildType,
      }: { bundlePath: string; buildType: "debug" | "release" },
    ) => {
      const { name } = await readAppJsonFile(bundlePath);
      await buildBusinessBundle({
        platform,
        name,
        env: "dev" as any,
        dev: buildType === "debug",
        root: bundlePath,
        output: path.join(bundlePath, `release_${platform}`),
        meta: DEFAULT_META_CONFIG,
      });
    },
  );

/**
 * Upload baseline command for CodePush baseline management
 * Uploads baseline information for hot update tracking
 */
program.command("upload-baseline").action(async () => {
  const manager = createBaseLineManager({
    app_version: "0.0.1",
    app_name: "XRNTemplate",
    platform: Platform.iOS,
    app_type: "Release",
    channel: "china",
    environment: "dev",
  });
  await manager.uploadBaseLine();
});

/**
 * Parse command line arguments and execute the appropriate command
 * This is the entry point for the CLI application
 */
program.parse(process.argv);
