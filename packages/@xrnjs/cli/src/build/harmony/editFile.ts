import { buildJobContext } from "../BuildJobContext";
import { execShellCommand } from "../utils/shell";
import fsExtra from "fs-extra";

import json5 from "json5";

import { checkTool, isProd } from "../utils";
import fs from "fs-extra";
import ora from "ora";
import { getCodePushKeyName } from "../../codePush/utils";
import logger from "../../utlis/logger";

function editEnvFile() {
  const { buildEnv, rootPath, appKey } = buildJobContext;
  const currentEnvDotFile = `${rootPath}/.env`;
  let envStagingContent = fs.readFileSync(currentEnvDotFile, "utf8");

  // 修改 ENV_NAME 为 buildEnv
  envStagingContent = envStagingContent.replace(
    /ENV_NAME=.*/,
    `ENV_NAME=${buildEnv}`
  );

  envStagingContent = envStagingContent.replace(
    /APP_KEY=.*/,
    `APP_KEY=${appKey}`
  );
  fs.writeFileSync(currentEnvDotFile, envStagingContent, "utf8");
  return currentEnvDotFile;
}

async function editCodePushKey(bundleName: string) {
  // 如果 codepush 命令不存在，则不进行修改
  const codePushCommand = await checkTool("code-push");
  if (!codePushCommand) {
    logger.warn("codepush 命令不存在，不进行 CodePush 信息修改");
    return;
  }
  const { buildEnv, rootPath, platform, project } = buildJobContext;
  const codepushKeyLoading = ora().start(`修改${bundleName}的codePushKey`);
  const codePushName = getCodePushKeyName({
    bundleName,
    platform,
    buildEnv,
    project,
  })

  const codePushKey = await execShellCommand(
    `code-push deployment list ${codePushName} -k | grep Production | awk -F ' ' '{print $4}'| tr -d '\n'`
  );
  if (!codePushKey) {
    codepushKeyLoading.fail(`${codePushName} key不存在`);
    return;
  }
  const codePushKeyName = `CODEPUSH_${bundleName
    .toLocaleUpperCase()
    .replace(/-/g, "_")}_KEY`;
  const rex = `'s/${codePushKeyName}=.*/${codePushKeyName}=${codePushKey}/'`;
  await execShellCommand(`sed -i "" ${rex} .env`, {
    cwd: `${rootPath}`,
  });

  codepushKeyLoading.succeed(bundleName + " : " + codePushKey);
}

const editAppJson = () => {
  const { version: versionName, rootPath } = buildJobContext;
  const versionCode = buildJobContext.getVersionNumber();
  const appJsonPath = `${rootPath}/harmony/AppScope/app.json5`;
  const appJson = json5.parse(fsExtra.readFileSync(appJsonPath, "utf-8"));
  appJson.app.versionName = versionName;
  appJson.app.versionCode = Number(versionCode);
//   appJson.app.bundleName = buildType === BuildType.DEBUG ? "com.xtapp.xtransfer.dev" : "com.xtapp.xtransfer";
  fsExtra.writeFileSync(appJsonPath, json5.stringify(appJson, null, 2));
};


export const editFile = async () => {
  const { buildEnv, subBundle, rootPath } = buildJobContext;
  editAppJson();

  if (!isProd(buildEnv)) {
    for (let index = 0; index < subBundle.length; index++) {
      const bundleItem = subBundle[index];
      await editCodePushKey(bundleItem.name);
    }
    editEnvFile();
  } else {
    fs.copyFileSync(`${rootPath}/.env.prod`, `${rootPath}/.env`)
  }
};
