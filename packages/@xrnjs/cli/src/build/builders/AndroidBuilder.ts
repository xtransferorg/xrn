import { buildAndroidApp } from "../android/buildAndroidApp";
import { uploadFile } from "../utils/ftp";
import { timingTracker } from "../TimingTracker";
import { TimingTrackerStage } from "../typing";
import fs from "fs-extra";
import path from "path";
import { BaseBuilder } from "./BaseBuilder";
import type { BuildResource } from "./BaseBuilder";

export class AndroidBuilder extends BaseBuilder {
  async cleanBundleDir(): Promise<void> {
    const { rootPath } = this.context;
    // 清除 android/app/src/main/assets 下的 .bundle 文件
    const assetsPath = `${rootPath}/android/app/src/main/assets`;
    if (await fs.pathExists(assetsPath)) {
      const files = await fs.readdir(assetsPath);
      for (const file of files) {
        if (file.endsWith(".bundle")) {
          await fs.unlink(path.join(assetsPath, file));
        }
      }
    }
    fs.ensureDirSync(assetsPath);
  }

  async build(): Promise<BuildResource[]> {
    timingTracker.time(TimingTrackerStage.ANDROID_BUILD);
    await this.writeDebugMetaManifest(
      "android/app/src/main/assets/xrn-manifest.json"
    );
    const results = await buildAndroidApp();
    timingTracker.timeEnd(TimingTrackerStage.ANDROID_BUILD);
    // 支持一个渠道多个产物
    return results.flatMap(({ channel, outputs }) =>
      outputs.map(({ name, path, arch, type }) => ({
        name,
        localPath: path,
        extra: { channel, arch, type },
      }))
    );
  }

  async upload(resources: BuildResource[]) {
    timingTracker.time(TimingTrackerStage.APP_UPLOAD);
    const results = [];
    for (let i = 0; i < resources.length; i++) {
      const res = resources[i];
      const link = await uploadFile(res.localPath);
      const { channel, arch, type } = res.extra || {};
      results.push({
        link,
        filePath: res.localPath,
        fileName: res.name,
        channel,
        arch,
        type,
      });
    }
    timingTracker.timeEnd(TimingTrackerStage.APP_UPLOAD);
    return results;
  }
}
