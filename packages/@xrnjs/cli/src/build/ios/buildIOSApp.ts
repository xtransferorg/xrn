import { execShellCommand } from "../utils/shell";
import { BuildEnv, BuildType } from "../typing";
import fs from "fs-extra";
import moment from "moment";
import { zipDirectory } from "../../utlis/archiveZip";
import logger from "../../utlis/logger";
import { editCodePushInfo } from "./editCodePushInfo";
import {
  copyExportOptionsPlist,
  editEnvInfo,
  editSchemeConfiguration,
  updateCFBundleVersion,
  updateExportOptions,
  updateProjectFile,
} from "./editFile";
import { buildJobContext } from "../BuildJobContext";

// 替换env

export async function buildiOSApp() {
  const {
    buildEnv,
    buildType,
    isSec,
    enableDsym,
    iosSimulator,
    nativeProjectName,
    rootPath,
  } = buildJobContext;

  // 初始化参数
  // rootPath 是 iOS App项目的目录

  const simulator = iosSimulator ? "_simulator" : "";
  const iOSArchivePath = `${rootPath}/iOS_Out_${buildType}${simulator}`;
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
  await editCodePushInfo();

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

  await execShellCommand(`pod repo update && pod install`, {
    cwd: `${rootPath}/ios`,
    oraName: "iOS Pod 安装",
  });

  // 拷贝 ExportOptions.plist 到 iOSArchivePath 目录，这里面需要进行区分App Store，adhoc，debug
  await copyExportOptionsPlist(iOSArchivePath);

  // 准备修改 ExportOptions.plist 中的 资源路径
  const sourceDir = `${iOSArchivePath}/${minor_version}.xcarchive/Products/Applications`;
  const ipaPath = `${iOSArchivePath}/${minor_version}/${scheme}.ipa`;
  const customName = `v${buildJobContext.version}_${moment().format(
    "YYYY-MM-DD_HH:mm:ss",
  )}_${buildJobContext.buildEnv}_${buildJobContext.project}`;
  const apkName = `${customName}.ipa`;
  const apkPath = iosSimulator
    ? `${rootPath}/${customName}.zip`
    : `${iOSArchivePath}/${minor_version}/${apkName}`;
  const manifestPath = `${iOSArchivePath}/${minor_version}/manifest.plist`;
  const apkManifestName = `${customName}_manifest.plist`;
  const apkManifestPath = `${iOSArchivePath}/${minor_version}/${apkManifestName}`;

  updateExportOptions(iOSArchivePath, enableDsym, apkName);

  // 打包命令
  if (iosSimulator) {
    await execShellCommand(
      `npx cross-env ENVFILE=${envDotName} XRN_BUILD_TYPE=${buildType} xcodebuild archive -workspace ${rootPath}/ios/${scheme}.xcworkspace -sdk iphonesimulator -arch x86_64 -scheme ${scheme} -archivePath ${iOSArchivePath}/${minor_version}.xcarchive`,
      { cwd: `${rootPath}/ios`, oraName: "iOS Simulator 打包" },
    );
  } else {
    await execShellCommand(
      `npx cross-env ENVFILE=${envDotName} XRN_BUILD_TYPE=${buildType} xcodebuild archive -workspace ${rootPath}/ios/${scheme}.xcworkspace -sdk iphoneos -scheme ${scheme} -archivePath ${iOSArchivePath}/${minor_version}.xcarchive`,
      { cwd: `${rootPath}/ios`, oraName: "iOS 真机打包" },
    );
    const exportIpaCommand = `xcodebuild -exportArchive -archivePath ${iOSArchivePath}/${minor_version}.xcarchive -exportPath ${iOSArchivePath}/${minor_version} -allowProvisioningUpdates -exportOptionsPlist ${iOSArchivePath}/ExportOptions.plist`;
    await execShellCommand(exportIpaCommand, {
      cwd: `${rootPath}/ios`,
      oraName: "iOS 归档打包",
    });
  }

  if (buildEnv != BuildEnv.prod && !iosSimulator) {
    // 修改 manifest 默认名称
    fs.renameSync(manifestPath, apkManifestPath);
  }

  if (iosSimulator) {
    await zipDirectory(sourceDir, apkPath);
  } else {
    fs.renameSync(ipaPath, apkPath);
    await fs.copy(apkPath, `${rootPath}/${apkName}`);
  }

  return {
    apkName,
    apkPath,
    apkManifestName,
    apkManifestPath,
    minor_version,
    iOSArchivePath,
  };
}
