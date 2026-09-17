import { buildHarmony } from "../harmony/buildHarmony";
import { uploadFile } from "../utils/ftp";
import { timingTracker } from "../TimingTracker";
import { TimingTrackerStage } from "../typing";
import { BuildResource, BaseBuilder } from "./BaseBuilder";
import fs from "fs-extra";
import path from "path";

export class HarmonyBuilder extends BaseBuilder {
  async cleanBundleDir(): Promise<void> {
    const { rootPath } = this.context;
    // 清除 harmony/entry/src/main/resources/rawfile 下的 .bundle 文件
    const rawfilePath = `${rootPath}/harmony/entry/src/main/resources/rawfile`;
    if (await fs.pathExists(rawfilePath)) {
      const files = await fs.readdir(rawfilePath);
      for (const file of files) {
        if (file.endsWith(".bundle")) {
          await fs.unlink(path.join(rawfilePath, file));
        }
      }
    }
  }

  async build(): Promise<BuildResource[]> {
    await this.writeDebugMetaManifest(
      "harmony/entry/src/main/resources/rawfile/xrn-manifest.json"
    );
    timingTracker.time(TimingTrackerStage.HARMONY_BUILD);
    const { fileName, filePath } = await buildHarmony();
    timingTracker.timeEnd(TimingTrackerStage.HARMONY_BUILD);
    return [{ name: fileName, localPath: filePath }];
  }

  async upload(resources: BuildResource[]) {
    const file = resources[0];
    timingTracker.time(TimingTrackerStage.APP_UPLOAD);
    const link = await uploadFile(file.localPath);
    timingTracker.timeEnd(TimingTrackerStage.APP_UPLOAD);
    return [{ link, filePath: file.localPath, fileName: file.name, channel: this.context.channel }];
  }
} 