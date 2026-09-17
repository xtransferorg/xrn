import { execInherit, execShellCommand } from "../utils/shell";
import { BuildEnv, BuildType, TimingTrackerStage } from "../typing";
import fs from "fs-extra";
import ora from "ora";
import moment from "moment";
import { zipDirectory } from "../../utlis/archiveZip";
import { spawnSync } from "child_process";
import logger from "../../utlis/logger";
import { editCodePushInfo } from "./editCodePushInfo";
import {
  copyExportOptionsPlist,
  editCommonBundleHash,
  editEnvInfo,
  editSchemeConfiguration,
  updateCFBundleVersion,
  updateExportOptions,
  updateProjectFile,
} from "./editFile";
import { buildJobContext } from "../BuildJobContext";
import { timingTracker } from "../TimingTracker";

// 替换env

export function getXcodeBuildConfiguration(buildType: BuildType): "Debug" | "Release" {
  return buildType === BuildType.DEBUG ? "Debug" : "Release";
}

export async function buildiOSApp() {
  const {
    buildEnv,
    buildType,
    isSec,
    enableDsym,
    iosSimulator,
    nativeProjectName,
    rootPath,
    verbose
  } = buildJobContext;

  const execMethod = verbose ? execInherit : execShellCommand

  // 初始化参数
  // rootPath 是 iOS App项目的目录

  const simulator = iosSimulator ? "_simulator" : "";
  const iOSArchivePath = `${rootPath}/iOS_Out_${buildType}${simulator}`;
  const xcodeBuildConfiguration = getXcodeBuildConfiguration(buildType);
  const scheme = nativeProjectName;
  if (!scheme) {
    throw new Error("不存在的iOS Scheme");
  }

  // const minor_version = calculateMinorVersion(buildEnv);

  const minor_version = buildJobContext.getVersionNumber();
  logger.info(`当前 iOS 的 Build Number 为: ${minor_version}`);

  // 替换 MARKETING_VERSION & 替换 CURRENT_PROJECT_VERSION
  updateProjectFile(scheme, minor_version, enableDsym);

  // 替换 CFBundleVersion
  updateCFBundleVersion(scheme, minor_version);

  // 修改 .env 配置
  const { envDotName } = editEnvInfo();

  // 修改 CodePush 相关配置
  await editCodePushInfo(scheme);


  // 写入 common bundle 的 hash 值
  await editCommonBundleHash()

  // 修改 Scheme 配置
  editSchemeConfiguration(scheme);

  //翻墙
  //await execShellCommand(`export https_proxy=http://127.0.0.1:7890 http_proxy=http://127.0.0.1:7890 all_proxy=socks5://127.0.0.1:7890`, { cwd: `${rootPath}` })
  //准备打包
  await execShellCommand(`npx react-native-fix-image --force`, {
    cwd: `${rootPath}`,
  });
  //await execShellCommand(`rm -rf Podfile.lock`, { cwd: `${rootPath}/ios` })
  // 控制pod install时，是否安装Flipper
  process.env.PRODUCTION = buildType === BuildType.RELEASE ? "1" : "0";
  process.env.XT_HERMES_DISABLE = buildType === BuildType.DEBUG ? "0" : "1";

  timingTracker.time(TimingTrackerStage.IOS_BUILD, "pod install");
  await execMethod(`pod repo update && pod install`, {
    cwd: `${rootPath}/ios`,
  });
  timingTracker.timeEnd(TimingTrackerStage.IOS_BUILD, "pod install");

  // 拷贝 ExportOptions.plist 到 iOSArchivePath 目录，这里面需要进行区分App Store，adhoc，debug
  await copyExportOptionsPlist(iOSArchivePath);

  // 准备修改 ExportOptions.plist 中的 资源路径
  const sourceDir = `${iOSArchivePath}/${minor_version}.xcarchive/Products/Applications`;
  const ipaPath = `${iOSArchivePath}/${minor_version}/${scheme}.ipa`;
  const customName = `v${buildJobContext.version}_${moment().format(
    "YYYY-MM-DD_HH:mm:ss"
  )}_${buildJobContext.buildEnv}_${buildJobContext.project}`;
  const apkName = `${customName}.ipa`;
  const apkPath = iosSimulator
    ? `${sourceDir}/${customName}.zip`
    : `${iOSArchivePath}/${minor_version}/${apkName}`;
  const manifestPath = `${iOSArchivePath}/${minor_version}/manifest.plist`;
  const apkManifestName = `${customName}_manifest.plist`;
  const apkManifestPath = `${iOSArchivePath}/${minor_version}/${apkManifestName}`;

  updateExportOptions(iOSArchivePath, enableDsym, apkName);

  // 打包命令
  timingTracker.time(TimingTrackerStage.IOS_BUILD, "xcodebuild archive");
  if (iosSimulator) {
    await execMethod(
      `npx cross-env ENVFILE=${envDotName} XRN_BUILD_TYPE=${buildType} xcodebuild archive -configuration ${xcodeBuildConfiguration} -workspace ${rootPath}/ios/${scheme}.xcworkspace -sdk iphonesimulator -arch x86_64 -scheme ${scheme} -archivePath ${iOSArchivePath}/${minor_version}.xcarchive`,
      { cwd: `${rootPath}/ios` }
    );
  } else {

    await execMethod(
      `npx cross-env ENVFILE=${envDotName} XRN_BUILD_TYPE=${buildType} xcodebuild archive -configuration ${xcodeBuildConfiguration} -workspace ${rootPath}/ios/${scheme}.xcworkspace -sdk iphoneos -scheme ${scheme} -archivePath ${iOSArchivePath}/${minor_version}.xcarchive -allowProvisioningUpdates`,
      { cwd: `${rootPath}/ios` }
    );
    const exportIpaCommand = `xcodebuild -exportArchive -archivePath ${iOSArchivePath}/${minor_version}.xcarchive -exportPath ${iOSArchivePath}/${minor_version} -allowProvisioningUpdates -exportOptionsPlist ${iOSArchivePath}/ExportOptions.plist`;
    try {
      await execMethod("command -v rvm", { cwd: process.cwd() });
      // 如果使用rvm情况下，一定要使用系统ruby，防止 exportArchive 失败
      // 注： 这个rvm use 只会在cli进程中 切换ruby，一旦cli终止，ruby依旧是之前的版本
      logger.info("本机存在rvm环境");
      const execLoad = ora(exportIpaCommand).start();
      const result = spawnSync("/bin/bash", [
        "--login",
        "-c",
        `rvm use system && ${exportIpaCommand}`,
      ]);
      if (result.status == 0) {
        // 状态值0，表示成功
        logger.info(result.stdout.toString());
        execLoad.succeed();
      } else {
        logger.info(result.stderr.toString());
        execLoad.fail();
      }
    } catch (_) {
      logger.info("本机不存在rvm环境");
      await execMethod(exportIpaCommand, { cwd: `${rootPath}/ios` });
    }
  }
  timingTracker.timeEnd(TimingTrackerStage.IOS_BUILD, "xcodebuild archive");

  if (buildEnv != BuildEnv.prod && !iosSimulator) {
    // 修改 manifest 默认名称
    fs.renameSync(manifestPath, apkManifestPath);
  }

  if (buildType === BuildType.RELEASE && buildEnv === BuildEnv.prod && process.env.Environment !== "pre-prod") {
    // 暂时不需要上传到TestFlight
    timingTracker.time(TimingTrackerStage.IOS_BUILD, "upload to TestFlight");
    const iOSApiKey = "658PM8QV28";
    const iOSIssuerId = "d90d1c75-c471-4012-9313-198a5d711c43";
    await execShellCommand(
      `xcrun altool --upload-app -f ${iOSArchivePath}/${minor_version}/${scheme}.ipa -t iOS --apiKey ${iOSApiKey} --apiIssuer ${iOSIssuerId} --verbose`,
      { cwd: `${rootPath}/ios` }
    );
    timingTracker.timeEnd(TimingTrackerStage.IOS_BUILD, "upload to TestFlight");
  }

  iosSimulator
    ? await zipDirectory(sourceDir, apkPath)
    : fs.renameSync(ipaPath, apkPath);
  return {
    apkName,
    apkPath,
    apkManifestName,
    apkManifestPath,
    minor_version,
    iOSArchivePath,
  };
}
