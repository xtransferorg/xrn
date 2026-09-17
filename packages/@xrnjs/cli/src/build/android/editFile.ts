import os from "os";
import { BuildType, Platform } from "../typing";
import { execShellCommand } from "../utils/shell";
import fs from "fs-extra";
import { buildJobContext } from "../BuildJobContext";
import ora from "ora";
import { isProd } from "../utils";
import { deserializeConnectionInfo } from "@xrnjs/code-push-cli";

export const getEnvFilePath = () => {
  const { buildEnv, rootPath } = buildJobContext;
  let envFilePath = `${rootPath}/.env.${buildEnv}`;
  if (!isProd(buildEnv)) {
    envFilePath = `${rootPath}/.env`;
  }
  return envFilePath;
};

async function editEnvFile() {
  const { buildEnv } = buildJobContext;
  const currentEnvDotFile = getEnvFilePath();
  let envStagingContent = fs.readFileSync(currentEnvDotFile, "utf8");

  // 修改 ENV_NAME 为 buildEnv
  envStagingContent = envStagingContent.replace(
    /ENV_NAME=.*/,
    `ENV_NAME=${buildEnv}`
  );

  const info = deserializeConnectionInfo();

  envStagingContent = envStagingContent.replace(
    /CODEPUSH_URL=.*/,
    `CODEPUSH_URL=${info?.customServerUrl}`
  );

  await execShellCommand("cat .env");
  fs.writeFileSync(currentEnvDotFile, envStagingContent, "utf8");
}

async function editCodePushKey(bundleName: string) {
  const { buildEnv } = buildJobContext;
  const codepushKeyLoading = ora().start(`修改${bundleName}的codePushKey`);
  // const codePushName = (buildEnv === BuildEnv.prod || buildEnv === BuildEnv.staging) ? `${projectName}-${platform}` : `${projectName}-${platform}-${buildEnv}`
  const codePushName = `${bundleName}-${Platform.Android}-${buildEnv}`; // 生产环境不需要修改

  const codePushKey = await execShellCommand(
    `code-push deployment list ${codePushName} -k | grep Production | awk -F ' ' '{print $4}'| tr -d '\n'`
  );
  if (!codePushKey) {
    codepushKeyLoading.warn(`${codePushName} key不存在，跳过CodePush Key写入`);
    return;
  }
  const codePushKeyName = `CODEPUSH_${bundleName
    .toLocaleUpperCase()
    .replace(/-/g, "_")}_KEY`;
  const rex = `'s/${codePushKeyName}=.*/${codePushKeyName}="${codePushKey}"/'`;
  const rootPath = process.cwd();
  await execShellCommand(`sed -i "" ${rex} gradle.properties`, {
    cwd: `${rootPath}/android`,
  });

  codepushKeyLoading.succeed(bundleName + " : " + codePushKey);
}

async function editAppVersion(newVersion: string) {
  const { rootPath } = buildJobContext;
  const versionNumber = buildJobContext.getVersionNumber();
  const editVersionCom = `sed -i "" "s/VERSIONCODE=.*/VERSIONCODE=${versionNumber}/" android/gradle.properties`;
  await execShellCommand(editVersionCom, { cwd: rootPath });
  await execShellCommand(
    `sed -i "" "s/VERSIONNAME=.*/VERSIONNAME=${newVersion}/" android/gradle.properties`,
    { cwd: rootPath }
  );
  ora().succeed(`本次打包信息:版本号:${newVersion}\n版本${versionNumber}`);
}

async function editGradleProperties(
  key: string,
  value: string,
  rootPath: string
) {
  // const enableHermesFlag = `enableHermes`;
  const rex = `'s/${key}=.*/${key}=${value}/'`;
  await execShellCommand(`sed -i "" ${rex} gradle.properties`, {
    cwd: `${rootPath}/android`,
  });
}

async function editEnableHermesFlag(
  enableHermesFlag: string,
  buildType: BuildType,
  rootPath: string
) {
  await editGradleProperties(
    enableHermesFlag,
    "true",
    rootPath
  );
}

export async function editChannelList() {
  const { channelList, rootPath } = buildJobContext;
  //   # Multi Channels, APK Channels
  // APK_CHANNELS=chinaNew,xiaomi,vivo,oppo,huawei,honor,feature
  // # Multi Channels, AAB Channels
  // AAB_CHANNELS=googlePlay,huawei
  const allApkChannels = [
    "chinaNew",
    "xiaomi",
    "vivo",
    "oppo",
    "huawei",
    "honor",
    "feature",
    "tencent"
  ];
  const allAabChannels = ["googlePlay", "huawei"];
  const apkChannels = channelList.filter((channel) =>
    allApkChannels.includes(channel)
  );
  const aabChannels = channelList.filter((channel) =>
    allAabChannels.includes(channel)
  );

  await editGradleProperties("APK_CHANNELS", apkChannels.join(","), rootPath);
  await editGradleProperties("AAB_CHANNELS", aabChannels.join(","), rootPath);
}

export const editFile = async () => {
  const { buildEnv, rootPath, buildType, subBundle, version, meta } =
    buildJobContext;
  if (!isProd(buildEnv)) {
    for (let index = 0; index < subBundle.length; index++) {
      const bundleItem = subBundle[index];
      await editCodePushKey(bundleItem.name);
    }
    // 在 debug 包中把 gradle.properties 文件中的 enableHermes=false 改为 enableHermes=true
    await editEnableHermesFlag("enableHermes", buildType, rootPath);
    await editEnableHermesFlag("hermesEnabled", buildType, rootPath);
    await editEnvFile();
  }
  await editAppVersion(version);
  if (meta.hash) {
    await editGradleProperties("COMMON_BUNDLE_HASH", meta.hash, rootPath);
  } else {
    if (buildJobContext.unpacking) {
      throw new Error("unpacking is true, but meta.hash is empty");
    }
  }
  const localPath = `${rootPath}/android/local.properties`;
  if (fs.existsSync(localPath)) {
    fs.rmSync(`${localPath}`);
  }

  await execShellCommand(
    `echo "sdk.dir=${os.homedir()}/Library/Android/sdk" > local.properties`,
    { cwd: `${rootPath}/android` }
  );
};
