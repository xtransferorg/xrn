import { execShellCommand } from "../utils/shell";
import { BuildEnv, BuildType } from "../typing";
import fs from "fs-extra";
import { getRemoteFileUrl } from "../utils/ftp";
import { buildJobContext } from "../BuildJobContext";
import path from 'path'
import logger from "../../utlis/logger";

// 更新导出选项
export function updateExportOptions(
  iOSArchivePath: string,
  enableDsym: boolean,
  apkName: string
) {
  const { buildEnv, buildType, iosSimulator } = buildJobContext;
  if (buildType === BuildType.RELEASE) {
    let exportOptionsContent = fs.readFileSync(
      `${iOSArchivePath}/ExportOptions.plist`,
      "utf8"
    );
    exportOptionsContent = exportOptionsContent.replace(
      /(<key>uploadSymbols<\/key>.*?<).*?(\/>)/gs,
      (_, prefix, suffix) => `${prefix}${enableDsym}${suffix}`
    );
    // 将更新后的内容写回文件
    fs.writeFileSync(
      `${iOSArchivePath}/ExportOptions.plist`,
      exportOptionsContent,
      "utf8"
    );
  }

  if (buildEnv != BuildEnv.prod && !iosSimulator) {
    const appURL = getRemoteFileUrl(apkName);
    const displayImageURL =
      "https://ftp.xtrfr.cn/atta-app-rn/ios/resources/milk_cat_57_57.png";
    const fullSizeImageURL =
      "https://ftp.xtrfr.cn/atta-app-rn/ios/resources/milk_cat_512_512.png";

    let exportOptionsContent = fs.readFileSync(
      `${iOSArchivePath}/ExportOptions.plist`,
      "utf8"
    );
    exportOptionsContent = exportOptionsContent.replace(
      /(<key>appURL<\/key>.*?<string>).*?(<\/string>)/gs,
      (_, prefix, suffix) => `${prefix}${appURL}${suffix}`
    );
    exportOptionsContent = exportOptionsContent.replace(
      /(<key>displayImageURL<\/key>.*?<string>).*?(<\/string>)/gs,
      (_, prefix, suffix) => `${prefix}${displayImageURL}${suffix}`
    );
    exportOptionsContent = exportOptionsContent.replace(
      /(<key>fullSizeImageURL<\/key>.*?<string>).*?(<\/string>)/gs,
      (_, prefix, suffix) => `${prefix}${fullSizeImageURL}${suffix}`
    );
    // 将更新后的内容写回文件
    fs.writeFileSync(
      `${iOSArchivePath}/ExportOptions.plist`,
      exportOptionsContent,
      "utf8"
    );
  }
}

// 拷贝 ExportOptions.plist 到 iOSArchivePath 目录，这里面需要进行区分App Store，adhoc，debug
export async function copyExportOptionsPlist(iOSArchivePath: string) {
  const { buildEnv, buildType, rootPath } = buildJobContext;
  const script_root = path.resolve(__dirname, "../../../");

  if (!fs.existsSync(iOSArchivePath)) {
    fs.mkdirSync(iOSArchivePath);
  }

  let exportOptionsType = "AdHoc_ExportOptions";
  if (buildType === BuildType.DEBUG) {
    exportOptionsType = "Development_ExportOptions";
  } else if (buildType === BuildType.RELEASE && buildEnv === BuildEnv.prod) {
    exportOptionsType = "AppStore_ExportOptions";
  }
  await execShellCommand(
    `cp ${script_root}/files/${exportOptionsType}.plist ${iOSArchivePath}/ExportOptions.plist`,
    { cwd: `${rootPath}` }
  );
}

// 修改 Scheme 配置
export function editSchemeConfiguration(scheme: string) {
  const { buildType, rootPath } = buildJobContext;
  if (buildType === BuildType.DEBUG) {
    // Edit Scheme
    const schemePath = `${rootPath}/ios/${scheme}.xcodeproj/xcshareddata/xcschemes/${scheme}.xcscheme`;
    let schemeContent = fs.readFileSync(schemePath, "utf8");
    schemeContent = schemeContent.replace(
      /(<ArchiveAction.*?buildConfiguration = ").*?(")/gs,
      (_, prefix, suffix) => `${prefix}Debug${suffix}`
    );
    fs.writeFileSync(schemePath, schemeContent, "utf8");
  }
}

// 替换 CFBundleVersion
export function updateCFBundleVersion(scheme: string, minor_version: string) {
  const { rootPath } = buildJobContext;
  const infoPlistPath = `${rootPath}/ios/${scheme}/Info.plist`;
  const infoPlistContent = fs.readFileSync(infoPlistPath, "utf8");
  const updatedInfoPlistContent = infoPlistContent.replace(
    /(<key>CFBundleVersion<\/key>.*?<string>).*?(<\/string>)/gs,
    (_, prefix, suffix) => `${prefix}${minor_version}${suffix}`
  );
  fs.writeFileSync(infoPlistPath, updatedInfoPlistContent, "utf8");
}

// 替换 MARKETING_VERSION & 替换 CURRENT_PROJECT_VERSION
export function updateProjectFile(
  scheme: string,
  minor_version: string,
  enableDsym: boolean
) {
  const { version, rootPath } = buildJobContext;
  const pbxprojPath = `${rootPath}/ios/${scheme}.xcodeproj/project.pbxproj`;
  let pbxprojContent = fs.readFileSync(pbxprojPath, "utf8");
  pbxprojContent = pbxprojContent.replace(
    /MARKETING_VERSION.*/g,
    `MARKETING_VERSION = ${version};`
  );
  pbxprojContent = pbxprojContent.replace(
    /CURRENT_PROJECT_VERSION.*/g,
    `CURRENT_PROJECT_VERSION = ${minor_version};`
  );
  //dsym符号表
  const dsymMark = enableDsym ? "dwarf-with-dsym" : "dwarf";
  pbxprojContent = pbxprojContent.replace(
    /DEBUG_INFORMATION_FORMAT.*/g,
    `DEBUG_INFORMATION_FORMAT = ${dsymMark};`
  );
  // sed -i "" '/uploadSymbols/{n;s/<.*\/>/<'$enbale_ios_dsym'\/>/g;}' $iOS_Archive_Path/ExportOptions.plist
  fs.writeFileSync(pbxprojPath, pbxprojContent, "utf8");
}

// 修改.env 配置
export function editEnvInfo() {
  const { buildEnv, rootPath } = buildJobContext;
  let envDotName = `.env`;
  if (buildEnv === BuildEnv.staging || buildEnv === BuildEnv.prod) {
    envDotName = `.env.${buildEnv === BuildEnv.prod ? "release" : "staging"}`;
  }

  const currentEnvDotFile = `${rootPath}/${envDotName}`;
  if (buildEnv !== BuildEnv.prod && buildEnv !== BuildEnv.staging) {
    logger.debug("=============  修改.env 配置  =============");

    // 读取 .env 文件内容
    let envContent = fs.readFileSync(currentEnvDotFile, "utf8");

    // 修改 ENV_NAME 为 buildEnv
    envContent = envContent.replace(/ENV_NAME=.*/, `ENV_NAME=${buildEnv}`);

    // 将更新后的内容写回 .env.staging 文件
    fs.writeFileSync(currentEnvDotFile, envContent, "utf8");

  }
  // updateAppKeyInEnvFile(currentEnvDotFile);
  return { envDotName };
}

// function updateAppKeyInEnvFile(currentEnvDotFile: string) {
//   let envContent = fs.readFileSync(currentEnvDotFile, "utf8");
//   const { buildType, platform, channel } = buildJobContext;
//   const { appKey } = getAppKey(platform, buildType, channel);
//   console.log("appKey", appKey);
//   if (envContent.includes('APP_KEY=')) {
//     envContent = envContent.replace(/APP_KEY=.*/, `APP_KEY=${appKey}`);
//   } else {
//     envContent += `\nAPP_KEY=${appKey}\n`;
//   }
//   fs.writeFileSync(currentEnvDotFile, envContent, "utf8");
//   return envContent;
// }

