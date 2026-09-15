import {
  getAppParentFileName,
  getBuildCommand,
  getFlavorEnvConfig,
} from "./package";
import { BuildType } from "../typing";
import { execInherit, execShellCommand } from "../utils/shell";
import fs from "fs-extra";
import moment from "moment";
import { buildJobContext, BuildJobContext } from "../BuildJobContext";
import { editChannelList, editFile, getEnvFilePath } from "./editFile";
import logger from "../../utlis/logger";
import type { AppFormat } from "../typing";

// 统一返回类型
export type Output = {
  type: "apk" | "aab";
  path: string;
  name: string;
  arch: "arm64-v8a" | "armeabi-v7a" | "universal" | "unknown";
  ready2ReinforcePath?: string; //待加固路径
};

export type BuildResult = {
  channel: string;
  outputs: Output[];
};

class AndroidBuildArtifactManager {
  private context: BuildJobContext;

  constructor(context: BuildJobContext) {
    this.context = context;
  }

  private async runBuildCommand(command: string, cwd: string) {
    if (this.context.verbose) {
      await execInherit(command, { cwd });
      return;
    }
    await execShellCommand(command, { cwd });
  }

  collectOutputs(artifactDir: string): Output[] {
    const outputs: Output[] = [];
    if (!fs.existsSync(artifactDir)) return outputs;
    const files = fs
      .readdirSync(artifactDir)
      .filter((f) => f.endsWith(".apk") || f.endsWith(".aab"));
    for (const name of files) {
      const ext = name.endsWith(".aab") ? "aab" : "apk";
      const arch = name.includes("arm64-v8a")
        ? "arm64-v8a"
        : name.includes("armeabi-v7a")
        ? "armeabi-v7a"
        : name.includes("universal")
        ? "universal"
        : "unknown";
      outputs.push({ type: ext, path: `${artifactDir}/${name}`, name, arch });
    }
    return outputs;
  }

  async renameAndReinforce(
    outputs: Output[],
    channel: string
  ): Promise<Output[]> {
    const result: Output[] = [];
    for (const o of outputs) {
      if (o.type === "apk") {
        const apkName = `v${this.context.version}_${moment().format(
          "YYYY-MM-DD_HH:mm:ss"
        )}_${this.context.buildEnv}_${channel}${
          this.context.buildType === BuildType.DEBUG ? "_debug" : ""
        }_${this.context.project}_${o.arch}.apk`;
        const newPath = `${o.path.substring(
          0,
          o.path.lastIndexOf("/")
        )}/${apkName}`;
        fs.renameSync(o.path, newPath);
        result.push({ ...o, path: newPath, name: apkName });
      } else {
        result.push(o);
      }
    }
    return result;
  }

  /**
   * 准备批量加固的目录
   * @returns 
   */
  getOutputReady2ReinforceDir(): string {
    return `${this.context.rootPath}/android/app/build/outputs/apk/ready_2_reinforce`
  }

  /**
   * 批量加固后的目录
   * @returns 
   */
  getOutputReinforceDir(): string {
    return `${this.context.rootPath}/android/app/build/outputs/apk/reinforce`
  }

  /**
   * output重命名，不加固
   * 用于批量加固场景
   * @param outputs 
   * @param channel 
   * @returns 
   */
  renameAndroidOutput(
    outputs: Output[],
    channel: string
  ): Output[] {
    logger.warn(`renameAndroidOutput====, ${channel}`)
    const result: Output[] = [];
    for (const o of outputs) {
      if (o.type === "apk") {
        const apkName = `v${this.context.version}_${moment().format(
          "YYYY-MM-DD_HH:mm:ss"
        )}_${this.context.buildEnv}_${channel}${
          this.context.buildType === BuildType.DEBUG ? "_debug" : ""
        }_${this.context.project}_${o.arch}.apk`;
        const newPath = `${o.path.substring(
          0,
          o.path.lastIndexOf("/")
        )}/${apkName}`;
        fs.renameSync(o.path, newPath);
        //批量加固，需要把所有apk放到一个目录中
        if (this.context.isSec) {
          logger.info(`批量加固:renameAndroidOutput====, copy from ${o.path} to ${newPath}`)
          const secPath = `${this.getOutputReady2ReinforceDir()}/${apkName}`
          fs.cpSync(newPath, secPath)
          o.ready2ReinforcePath = secPath
        }
        result.push({ ...o, path: newPath, name: apkName });
      } else {
        result.push(o);
      }
    }
    return result;
  }

  getChannelName(dir: string, envFlavor: string): string | undefined {
    let channelName = dir;
    if (channelName.startsWith(envFlavor)) {
      channelName = channelName.replace(envFlavor, "");
    }
    if (channelName.toLowerCase().includes("release")) {
      channelName = channelName.replace(/release/i, "");
    }
    channelName = channelName
      .replace(/^\W+|\W+$/g, "")
      .replace(/^./, (c) => c.toLowerCase());
    if (!channelName) {
      logger.warn(`Channel name is empty for directory: ${dir}`);
      return undefined;
    }
    return channelName;
  }

  async buildSingleChannelResult(channel: string): Promise<BuildResult[]> {
    await this.runBuildCommand(
      `npx cross-env ENVFILE=${getEnvFilePath()} ${getBuildCommand(
        this.context.buildEnv,
        this.context.buildType,
        channel,
        this.context.appFormat as AppFormat
      )}`,
      `${this.context.rootPath}/android`
    );
    const apkParentFilePath = `${
      this.context.rootPath
    }/android/app/build/outputs/${getAppParentFileName(
      channel,
      this.context.buildEnv,
      this.context.buildType,
      this.context.appFormat as AppFormat
    )}`;
    let outputs = this.collectOutputs(apkParentFilePath);
    outputs = this.renameAndroidOutput(outputs, channel);
    const buildResult = [{ channel, outputs }]
    return buildResult;
  }

  async buildMultiChannelResult(): Promise<BuildResult[]> {
    const envFlavor = getFlavorEnvConfig(this.context.buildEnv);
    const results: BuildResult[] = [];
    // 执行多渠道打包命令
    const gradleCmd = `npx cross-env ENVFILE=${getEnvFilePath()} ./gradlew generateCodegenArtifactsFromSchema app:assembleMultiChannels -PenvFlavor=${envFlavor} -PbuildType=${
      this.context.buildType
    }`;
    await this.runBuildCommand(gradleCmd, `${this.context.rootPath}/android`);
    //创建准备批量加固和批量加固的目录
    fs.mkdirSync(this.getOutputReady2ReinforceDir())
    fs.mkdirSync(this.getOutputReinforceDir())
    const collectByRoot = (root: string, ext: "apk" | "aab") => {
      if (!fs.existsSync(root)) return;
      const channelDirs = fs
        .readdirSync(root)
        .filter((d) => fs.statSync(`${root}/${d}`).isDirectory());
      for (const dir of channelDirs) {
        const channelName = this.getChannelName(dir, envFlavor);
        if (!channelName) continue;
        const artifactDir =
          ext === "apk" ? `${root}/${dir}/${this.context.buildType}` : `${root}/${dir}`;
        let outputs = this.collectOutputs(artifactDir).filter(
          (o) => o.type === ext
        );
        if (outputs.length > 0) {
          if (ext === "apk") {
            //只是重命名，不加固
            outputs = this.renameAndroidOutput(outputs, channelName);
          }
          let channelResult = results.find((r) => r.channel === channelName);
          if (!channelResult) {
            channelResult = { channel: channelName, outputs: [] };
            results.push(channelResult);
          }
          channelResult.outputs.push(...outputs);
        }
      }
    };
    collectByRoot(
      `${this.context.rootPath}/android/app/build/outputs/apk`,
      "apk"
    );
    collectByRoot(
      `${this.context.rootPath}/android/app/build/outputs/bundle`,
      "aab"
    );
    logger.warn(`批量加固，待加固======== ${JSON.stringify(results)}`, )
    return results;
  }
}

export async function buildAndroidApp() {
  const { channel, channelList } = buildJobContext;
  if (channelList.length > 1) {
    await editChannelList();
  }
  await editFile();
  // Skip `gradlew clean`: the built-in clean task wipes buildDir of every
  // autolinked subproject (node_modules/<pkg>/android/build), but AGP's
  // prefab/codegen tasks are then wrongly reported UP-TO-DATE (their output
  // snapshots live outside buildDir), so they don't regenerate and the app's
  // configureCMake fails with "directory .../prefab is not readable" /
  // "react_codegen_* not built by this project". Incremental builds succeed, so
  // avoid wiping the native intermediate artifacts.
  // if (buildJobContext.verbose) {
  //   await execInherit(`./gradlew clean`, {
  //     cwd: `${buildJobContext.rootPath}/android`,
  //   });
  // } else {
  //   await execShellCommand(`./gradlew clean`, {
  //     cwd: `${buildJobContext.rootPath}/android`,
  //   });
  // }
  const manager = new AndroidBuildArtifactManager(buildJobContext);
  if (channel === "all" || channelList.length > 1) {
    return await manager.buildMultiChannelResult();
  } else {
    return await manager.buildSingleChannelResult(channel);
  }
}
