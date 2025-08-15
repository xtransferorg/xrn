import {
  getAppParentFileName,
  getBuildCommand,
  getFlavorEnvConfig,
} from "./package";
import { BuildType } from "../typing";
import { execShellCommand } from "../utils/shell";
import fs from "fs-extra";
import moment from "moment";
import { buildJobContext } from "../BuildJobContext";
import { editFile, getEnvFilePath } from "./editFile";

export async function buildAndroidApp(channels?: string[]) {
  const {
    version,
    buildType,
    buildEnv,
    isSec,
    channel: contextChannel,
    appFormat,
    rootPath,
    project,
  } = buildJobContext;
  await editFile();

  // gradle clean
  await execShellCommand(`./gradlew clean`, { cwd: `${rootPath}/android`, oraName: "清理 Android 构建" });

  const buildChannels =
    channels && channels.length > 0 ? channels : [contextChannel];
  const results: { apkPath: string; apkName: string; channel: string }[] = [];

  for (const ch of buildChannels) {
    // gradle assemble
    await execShellCommand(
      `npx cross-env ENVFILE=${getEnvFilePath()} ${getBuildCommand(
        buildEnv,
        buildType,
        ch,
        appFormat
      )}`,
      { cwd: `${rootPath}/android`, oraName: `构建 Android ${ch} 渠道` }
    );

    const apkParentFilePath = `${rootPath}/android/app/build/outputs/${getAppParentFileName(
      ch,
      buildEnv,
      buildType,
      appFormat
    )}`;
    const apkName = `v${version}_${moment().format(
      "YYYY-MM-DD_HH:mm:ss"
    )}_${buildEnv}_${ch}${
      buildType === BuildType.DEBUG ? "_debug" : ""
    }_${project}.${appFormat}`;
    const newApkPath = `${apkParentFilePath}/${apkName}`;
    const envFlavor = getFlavorEnvConfig(buildEnv);
    const oldApkName = `${apkParentFilePath}/${["app", envFlavor, ch, buildType].filter(Boolean).join("-")}.${appFormat}`;
    fs.renameSync(oldApkName, newApkPath);
    await fs.copy(newApkPath, `${rootPath}/${apkName}`);
    results.push({ apkPath: newApkPath, apkName, channel: ch });
  }
  return results;
}
