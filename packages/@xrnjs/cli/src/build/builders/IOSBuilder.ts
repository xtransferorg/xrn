import { buildiOSApp } from "../ios/buildIOSApp";
import { uploadFile, manifestPrefix } from "../utils/ftp";
import { timingTracker } from "../TimingTracker";
import { BuildEnv, TimingTrackerStage } from "../typing";
import { BuildResource, BaseBuilder } from "./BaseBuilder";
import { uploadIOSArchive } from "../ios/uploadIOSArchive";
import logger from "../../utlis/logger";
import { removeDirAndCreateEmptyDir } from "../utils/file";

export class IOSBuilder extends BaseBuilder {
  async cleanBundleDir(): Promise<void> {
    const { rootPath } = this.context;
    // 移除壳子工程中的 release_ios 目录下内容
    await Promise.resolve(removeDirAndCreateEmptyDir(`${rootPath}/release_ios`));
  }

  async build(): Promise<BuildResource[]> {
    const { buildEnv } = this.context;
    await this.writeDebugMetaManifest("release_ios/assets/manifest.json");
    timingTracker.time(TimingTrackerStage.IOS_BUILD);
    const { apkName, apkPath, apkManifestPath, minor_version } = await buildiOSApp();
    timingTracker.timeEnd(TimingTrackerStage.IOS_BUILD);
    const resources: BuildResource[] = [
      { name: apkName, localPath: apkPath, extra: { minor_version } },
    ];
    if (
      buildEnv != BuildEnv.prod &&
      !this.context.iosSimulator &&
      !!apkManifestPath
    ) {
      resources.push({ name: apkName + '.manifest', localPath: apkManifestPath });
    }
    return resources;
  }

  async upload(resources: BuildResource[]) {
    const apk = resources[0];
    const manifest = resources[1];
    let link = "";
    if (manifest) {
      timingTracker.time(TimingTrackerStage.APP_UPLOAD);
      await uploadFile(apk.localPath);
      link = await uploadFile(manifest.localPath);
      link = manifestPrefix + link;
      logger.info("iOS ftp 🐷下载地址: ", link);
      timingTracker.timeEnd(TimingTrackerStage.APP_UPLOAD);
    } else {
      link = await uploadFile(apk.localPath);
    }
    await uploadIOSArchive(apk.extra?.minor_version);
    return [{ link, filePath: apk.localPath, fileName: apk.name, channel: this.context.channel }];
  }
} 