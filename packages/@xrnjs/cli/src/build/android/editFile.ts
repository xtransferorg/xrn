import os from "os";
import { BuildType, Platform } from "../typing";
import { execShellCommand } from "../utils/shell";
import fs from "fs-extra";
import { buildJobContext } from "../BuildJobContext";
import ora from "ora";
import { checkTool, isProd } from "../utils";
import { getCodePushKeyName } from "../../codePush/utils";
import logger from "../../utlis/logger";

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
  await execShellCommand("cat .env");
  fs.writeFileSync(currentEnvDotFile, envStagingContent, "utf8");
}

async function editCodePushKey(bundleName: string) {
  // 如果 codepush 命令不存在，则不进行修改
  const codePushCommand = await checkTool("code-push");
  if (!codePushCommand) {
    logger.warn("codepush 命令不存在，不进行 CodePush 信息修改");
    return;
  }

  const { buildEnv, project, platform } = buildJobContext;
  const codepushKeyLoading = ora().start(`修改${bundleName}的codePushKey`);
  const codePushName = getCodePushKeyName({
    bundleName,
    platform,
    buildEnv,
    project: project,
  });

  const codePushKey = await execShellCommand(
    `code-push deployment list ${codePushName} -k | grep Production | awk -F ' ' '{print $4}'| tr -d '\n'`
  );
  if (!codePushKey) {
    codepushKeyLoading.fail(`${codePushName} key不存在`);
    return;
    // throw new Error(
    //   `${codePushName} key不存在`
    // );
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

async function editEnableHermesFlag(
  enableHermesFlag: string,
  buildType: BuildType,
  rootPath: string
) {
  const rex = `'s/${enableHermesFlag}=.*/${enableHermesFlag}=${
    buildType === BuildType.DEBUG
  }/'`;
  await execShellCommand(`sed -i "" ${rex} gradle.properties`, {
    cwd: `${rootPath}/android`,
  });
}

export const editFile = async () => {
  const { buildEnv, rootPath, buildType, subBundle, version } = buildJobContext;
  if (!isProd(buildEnv)) {
    for (let index = 0; index < subBundle.length; index++) {
      const bundleItem = subBundle[index];
      await editCodePushKey(bundleItem.name);
    }
    // 在 debug 包中把 gradle.properties 文件中的 enableHermes=false 改为 enableHermes=true
    // await editEnableHermesFlag("enableHermes", buildType, rootPath);
    // await editEnableHermesFlag("hermesEnabled", buildType, rootPath);
    await editEnvFile();
  }
  await editAppVersion(version);
  const localPath = `${rootPath}/android/local.properties`;
  if (fs.existsSync(localPath)) {
    fs.rmSync(`${localPath}`);
  }

  await execShellCommand(
    `echo "sdk.dir=${os.homedir()}/Library/Android/sdk" > local.properties`,
    { cwd: `${rootPath}/android` }
  );
};
