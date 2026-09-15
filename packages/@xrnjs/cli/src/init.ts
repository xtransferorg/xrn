#!/usr/bin/env node

import { build } from './build';
import { codePush } from './codePush/init';
import { BuildEnv, BuildCommandOptions, Platform } from './build/typing';
import { execShellCommand } from './build/utils/shell';
import { runApp } from './startApp';
import { XrnStartArgs } from './startApp/types';
import { rollback, rollbackByChannelReleaseId, rollbackByUuid } from './codePush/rollback';
import { grayRelease } from './codePush/grayRelease';
import logger from './utlis/logger';
import path from 'path';
import { startCommand, bundleCommand } from '@react-native/community-cli-plugin';

import { buildJobContext } from './build/BuildJobContext';
import { buildBundle } from './build/bundle/adapter';
import { appPublish } from './publish';
import { publishJobContext } from './publish/PublishJobContext';
import { PublishCommandOptions } from './publish/publishTypes';
import { AppRolloutOptions } from './rollout/types';
import { appRollout } from './rollout';
import { startAppContext } from './startApp/StartAppContext';
import { program } from './command/program';
import { registerToolCommands } from './command/registerToolCommands';
import { init as initCodePushSdk } from '@xrnjs/code-push-cli'
import { runPostInstall, runPostInstallForPlatforms, PostInstallPlatform } from './postinstall';

const DEEP_IMPORT_ENV = 'XRN_ENABLE_DEEP_IMPORT';

function configureDeepImport(enabled: string | undefined = 'true'): void {
  process.env[DEEP_IMPORT_ENV] = enabled === 'false' ? 'false' : 'true';
}

registerToolCommands(program);

program
  .command('build <project>')
  .argument('<platform>', 'iOS和android、harmony')
  .argument('[version]', 'APP版本号')
  .option('--syncTargetEnv <syncTargetEnv>', '同步基线/发布目标环境(dev/pre-prod/staging)', '')
  .option('-p --appPath <appPath>', 'app相对仓库的路径，兼容多包仓库场景', '')
  .option('--nativeRoot <nativeRoot>', '构建完成后将安装包复制到原生工程根目录')
  .option('-t --type <buildType>', '设置打包类型debug release', 'release')
  .option('-b --bundleBranch <bundleBranch>', '设置bundle打包分支', 'master')
  .option('-c --channel <channel>', '打包渠道', 'china')
  .option('-f  --appFormat <appFormat>', 'App包格式', '')
  .option('-s --sec <sec>', '设置加固', 'false')
  .option('-d --dsym <dsym>', '符号表输出', 'false')
  .option('-sim --iosSimulator <iosSimulator>', 'iOS模拟器打包', 'false')
  .option('-e --verbose [verbose]', '调试模式', false)
  .option('--skip [skip]', '跳过原生打包', false)
  .option('--shouldFirstCodePush <shouldFirstCodePush>', '是否发布热更新', 'true')
  .option('--minSupportedVersion <minSupportedVersion>', '最小支持App版本，低于此版本将强制更新')
  .option('--bundles <bundles>', '用逗号分割的bundle名称列表，默认为all表示所有', 'all')
  .option('--hermes <hermes>', '是否启用 Hermes 编译，true 或 false', 'true')
  .option('--enableDeepImport <enableDeepImport>', '是否启用 deep-import Babel 插件，true 或 false', 'true')
  .allowUnknownOption(true)
  .description('xt-app-rn 打原生包')
  .action(async (
    project: string,
    platform: Platform,
    version = '',
    options: BuildCommandOptions) => {
      configureDeepImport(options.enableDeepImport);
      initCodePushSdk();
      await buildJobContext.init(project, platform, version, BuildEnv.dev, options);

      if (buildJobContext.verbose) {
        logger.debug(`当前执行路径: ${process.cwd()}`);
        logger.debug(`程序存放路径: ${__dirname}`);
      }

      buildJobContext.logInfo();

      await execShellCommand("watchman watch-del-all");
      await build();
      logger.info('打包脚本，脚本结束标识V3！！！');
  });

program
  .command('app-publish <project>')
  .argument('<platform>', 'iOS和android')
  .argument('[version]', 'APP版本号')
  .option('--syncTargetEnv <syncTargetEnv>', '同步基线/发布目标环境(dev/pre-prod/staging)', '')
  .option('-p --appPath <appPath>', 'app相对仓库的路径，兼容多包仓库场景', '')
  .option('-t --type <buildType>', '设置打包类型debug release', 'release')
  .option('-b --bundleBranch <bundleBranch>', '设置bundle打包分支', 'master')
  .option('-c --channel <channel>', '打包渠道', 'china')
  .option('-f  --appFormat <appFormat>', 'App包格式', '')
  .option('-s --sec <sec>', '设置加固', 'false')
  .option('-d --dsym <dsym>', '符号表输出', 'false')
  .option('-sim --iosSimulator <iosSimulator>', 'iOS模拟器打包', 'false')
  .option('-e --verbose [verbose]', '调试模式', 'false')
  .option('--updateType <updateType>', '更新类型', 'force')
  .option('--notOnlyApplyVersion <notOnlyApplyVersion>', '如果设置了此参数，表示除了此版的App都能收到本次更新', '')
  .requiredOption('--changeLog <changeLog>', '更新日志')
  .option('--isBackwardCompatible <isBackwardCompatible>', '是否向后兼容', 'false')
  .option('--minSupportedVersion <minSupportedVersion>', '最小支持App版本，低于此版本将强制更新')
  .option('--skip [skip]', '跳过原生打包', 'false')
  .option('--shouldFirstCodePush <shouldFirstCodePush>', '是否发布热更新', 'true')
  .option('--privateKey <privateKey>', '密钥地址')
  .option('--bundles <bundles>', '用逗号分割的bundle名称列表，默认为all表示所有', 'all')
  .option('--hermes <hermes>', '是否启用 Hermes 编译，true 或 false', 'true')
  .option('--enableDeepImport <enableDeepImport>', '是否启用 deep-import Babel 插件，true 或 false', 'true')
  .allowUnknownOption(true)
  .description('xt-app-rn 发布')
  .action(async (
    project: string,
    platform: Platform,
    version = '',
    options: PublishCommandOptions) => {
      if (platform.toLowerCase() === 'android' && !options.privateKey) {
        logger.error('android 平台必须提供 --privateKey 参数');
        process.exit(1);
      }
      configureDeepImport(options.enableDeepImport);
      if (!options.changeLog) {
        logger.error("changeLog 不能为空");
        process.exit(1);
      }
      // 强制更新时，最小支持版本使用当前版本
      if (options.updateType === 'Force') {
        logger.warn('强制更新，最小支持版本使用当前版本');
        options.minSupportedVersion = version
      }
      initCodePushSdk();
      await buildJobContext.init(project, platform, version, BuildEnv.prod, options);
      publishJobContext.initPublish(buildJobContext, options);

      if (buildJobContext.verbose) {
        logger.debug(`当前执行路径: ${process.cwd()}`);
        logger.debug(`程序存放路径: ${__dirname}`);
      }

      buildJobContext.logInfo();

      await execShellCommand("watchman watch-del-all");
      await appPublish();
  });

program
  .command('app-rollout')
  .description('Perform an app rollout with specified options')
  .option('-v, --versionId <string>', '灰度流量 0~100')
  .option('-r, --rollout <string>', '灰度流量 0~100')
  .option('-b, --isBackwardCompatible <string>', '是否向下兼容')
  .option('-s, --status <status>', '发布状态')
  .option('-w, --whiteList <string>', '白名单，设备id 逗号分割')
  .option('-u, --updateType <string>', '更新类型')
  .option('-n, --notOnlyApplyVersion <string>', '如果设置了此参数，表示除了此版的App都能收到本次更新')
  .action(async (options: AppRolloutOptions) => {
    // 您可以在这里处理传入的选项
    console.log('App Rollout Options:', options);
    await appRollout(options);
  });

program
  .command('codepush')
  .argument('<app>', 'XDeal or XTransfer')
  .argument('<platform>', '打包平台')
  .argument('<appVersion>', 'APP版本号')
  .argument('<env>', '设置打包环境 sitxt1-sitxt82 staging prod')
  .option('-b --branch <branch>', '设置bundle打包分支', 'master')
  .option('-i --increment <increment>', '设置是否增量更新', 'true')
  .option('-desc --desc <desc>', '更新文案', '')
  .option('-m --mandatory <mandatory>', '是否强制', 'false')
  .option('--uuid <uuid>', '用于在某些平台中回滚使用。')
  .option('--rollout <rollout>', '灰度比例')
  .option('--whiteList <whiteList>', '灰度白名单')
  .option('--channelReleaseId <channelReleaseId>', '渠道发布id')
  .option('--privateKey <privateKey>', '密钥地址')
  .option('--dev <dev>', '是否开发模式', 'false')
  .option('--enableDeepImport <enableDeepImport>', '是否启用 deep-import Babel 插件，true 或 false', 'true')
  .description('xt-app-rn 发布热更新')
  .action(async (app, platform, appVersion, env, option) => {
    if (platform.toLowerCase() === 'android' && !option.privateKey) {
      logger.error('android 平台必须提供 --privateKey 参数');
      process.exit(1);
    }
    configureDeepImport(option.enableDeepImport);
    initCodePushSdk();
    // appVersion 3.6.923,3.6.924
    const versionParts: string[] = appVersion.split(',');
    const version = versionParts[versionParts.length - 1]
    const { branch, increment, desc, mandatory, uuid, rollout, whiteList, channelReleaseId, privateKey, dev } = option;
    const appConfig = require(`${process.cwd()}/app.json`);
    const projectName = appConfig.name
    const skipCheckXtRnCoreVersion = appConfig.skipCheckXtRnCoreVersion
    logger.info(`ProjectName============${app}`);
    logger.info("--打包参数", { branch, isIncrement: increment, platform, desc, appVersion, isMandatory: mandatory, projectName, uuid, dev, versionParts })
    const isIncrement = increment === "true"
    const isDev = dev === "true"
    await codePush({ privateKey, app, projectName: projectName, branch, isIncrement: isIncrement, platform, desc, env, appVersion: version, isMandatory: mandatory, uuid, rollout, whiteList, channelReleaseId, skipCheckXtRnCoreVersion, isDev, versionParts })
  });


program
  .command('rollback')
  .argument('<bundle>', 'bundle 名称，比如 xt-app-main')
  .argument('<platform>', '系统信息，比如 IOS、Android')
  .argument('<appVersion>', 'APP版本号，比如 3.2.15')
  .argument('<env>', '环境信息，比如 staging、prod、sitxt1...')
  .option('--label [label]', '设置回滚的版本')
  .option('--targetUuid [targetUuid]', '批量回滚，用于在某些平台中回滚使用。（在发布热更新时需要携带uuid信息）')
  .option('--rollbackUuid [rollbackUuid]', '批量回滚，用于确定当前回滚后新记录的 uuid')
  .option('--previous [previous]', '是否回滚到目标版本的上一个版本')
  .description('codepush 回滚')
  .action(async (bundle: string, platform: Platform, appVersion: string, env: string, option: {
    label?: string,
    targetUuid?: string
    rollbackUuid?: string
    previous?: boolean
  }) => {
    const { label, targetUuid, rollbackUuid, previous } = option
    await rollback({
      bundleName: bundle,
      env: env,
      platform: platform,
      appVersion: appVersion,
      label: label,
      targetUuid: targetUuid,
      rollbackUuid: rollbackUuid,
      previous: previous,
    })
  });

program
  .command('batchPatch')
  .requiredOption('--channelReleaseId <channelReleaseId>', '用于确定哪发布单需要修改')
  .option('--rollout <rollout>', '设置灰度比例')
  .option('--whiteList <whiteList>', '设置灰度白名单')
  .description('热更新灰度比例和白名单修改')
  .action(async (option: {
    channelReleaseId: string;
    rollout: string;
    whiteList?: string;
  }) => {
    await grayRelease({
      channelReleaseId: option.channelReleaseId,
      rollout: option.rollout,
      whiteList: option.whiteList,
    })
  })


program
  .command('batchRollback')
  .option('--channelReleaseId <channelReleaseId>', '用于确定哪发布单需要回滚')
  .option('--previous [previous]', '是否回滚到目标版本的上一个版本')
  .option('--targetUuid [targetUuid]', '批量回滚，用于在某些平台中回滚使用。（在发布热更新时需要携带uuid信息）')
  .option('--rollbackUuid [rollbackUuid]', '批量回滚，用于确定当前回滚后新记录的 uuid')
  .description('按照发布单回滚')
  .action(async (option: {
    channelReleaseId?: string;
    targetUuid?: string;
    rollbackUuid?: string;
    previous: boolean
  }) => {
    if (option.channelReleaseId) {
      await rollbackByChannelReleaseId(option.channelReleaseId, option.previous);
      return;
    }
    if (option.targetUuid && option.rollbackUuid) {
      await rollbackByUuid(option.targetUuid, option.rollbackUuid, option.previous);
      return;
    }
    throw new Error('参数错误. channelReleaseId 或者 targetUuid 和 rollbackUuid 必须有一个');
  })

const start = program.command("start").alias('xrn-start').description("启动服务");
startCommand.options.map((option) => {
  if (option.parse) {
    start.option(
      option.name,
      option.description,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      option.parse,
      option.default
    );
  } else {
    start.option(option.name, option.description, option.default);
  }
});

start
.description('app 启动工具')
.option('--project [project]', '设置XTransfer还是其它APP')
.option(
  '--local [local]',
  '是否本地启动，用于本地打包debug时使用（一般原生同学在修改依赖后需要使用，调试完成后给业务需要打debug包，不能把本地的debug包给业务）',
  (value) => {
    return value === 'true';
  },
  false
)
.option('--verbose [verbose]', '调试模式', false)
.option('-d --device-type [deviceType]', '设置设备类型')
.option('--branch [branch]', '从哪个分支拉取app包', '')
.option('--project [project]', '设置XTransfer还是其它APP', 'XTransfer')
.option('--package-name [packageName]', 'app 包名', 'com.xtapp.xtransfer.debug')
.option('--nativeRoot [nativeRoot]', '原生工程目录，支持相对当前目录的路径', '.')
.option('--native-root [nativeRoot]', '原生工程目录（--nativeRoot 的 kebab-case 别名）')
.option('--app-version [version]', '设置app版本号，设置为select时开启命令行交互选择版本号', 'latest')
.option('-e --verbose [verbose]', '调试模式', false)
.option('--new-tab', '在新tab中打开rn服务进程', false)
.allowUnknownOption(true)
.action(async (options: XrnStartArgs) => {
  await startAppContext.init(options)
  await runApp(options)
  // await startBusinessBundle(options);
});

const bundle = program.command('bundle').argument('<type>', 'common or biz').description('构建 bundle')
bundleCommand.options.map((option) => {
  if (option.parse) {
    bundle.option(
      option.name,
      option.description,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      option.parse,
      option.default
    );
  } else {
    bundle.option(option.name, option.description, option.default);
  }
})
bundle.option('-o, --output-meta-json [outputMetaJson]', '输出json文件路径')
bundle.requiredOption('-v, --appVersion <appVersion>', 'APP版本,用来获取 common 依赖', '0.0.1').action(async (type, options) => {
  try {
    const server = process.cwd().split(path.sep)
    const name = server[server.length - 1]
    logger.info(`构建 ${type}`, {...options, name})
    await buildBundle({
      ...options,
      type,
      name
    })
  } catch(error) {
    logger.error(error instanceof Error ? error.message : JSON.stringify(error))
    process.exit(1)
  }
})

program
  .command('postinstall')
  .argument('<platforms...>', '平台类型: android, ios, harmony, bundle')
  .description('执行平台相关的 postinstall 脚本')
  .action(async (platforms: string[]) => {
    const validPlatforms: PostInstallPlatform[] = ['android', 'ios', 'harmony', 'bundle'];
    const platformList = platforms
      .map((item) => item.trim())
      .filter(Boolean);

    if (platformList.length === 0) {
      logger.error(`平台参数不能为空，支持的平台有: ${validPlatforms.join(', ')}`);
      process.exit(1);
    }

    const invalidPlatforms = platformList.filter(
      (platform) => !validPlatforms.includes(platform as PostInstallPlatform)
    );
    if (invalidPlatforms.length > 0) {
      logger.error(`不支持的平台: ${invalidPlatforms.join(', ')}，支持的平台有: ${validPlatforms.join(', ')}`);
      process.exit(1);
    }

    if (platformList.length === 1) {
      await runPostInstall(platformList[0] as PostInstallPlatform);
      logger.info('postinstall 执行成功！');
      return;
    }

    await runPostInstallForPlatforms(platformList as PostInstallPlatform[]);
    logger.info('postinstall 执行成功！');
  });

program.parse(process.argv);
