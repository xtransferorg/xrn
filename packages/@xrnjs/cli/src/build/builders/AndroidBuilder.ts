import { buildAndroidApp } from "../android/buildAndroidApp";
import { uploadFile } from "../utils/ftp";
import { BuildType } from "../typing";
import { isProd } from "../utils";
import { COMMON_BASE_KEY } from "../../codePush/diff";
import fs from "fs-extra";
import path from "path";
import { BuildResource, BaseBuilder } from "./BaseBuilder";
import { CHANNEL_LIST } from "../constants/channel";

export class AndroidBuilder extends BaseBuilder {
  async build(): Promise<BuildResource[]> {
    const { buildEnv, buildType, rootPath, channel } = this.context;
    let channels: string[] = [];
    if (channel === "all") {
      channels = CHANNEL_LIST;
    } else {
      channels = [channel];
    }
    if (buildType === BuildType.DEBUG && !isProd(buildEnv)) {
      const metaJson = {
        dependencies: require(path.join(rootPath, "package.json")).dependencies,
        [COMMON_BASE_KEY]: this.meta,
      };
      await fs.writeFile(
        path.resolve(rootPath, "android/app/src/main/assets/xrn-manifest.json"),
        JSON.stringify(metaJson),
        "utf-8"
      );
    }
    const results = await buildAndroidApp(channels);
    return results.map(({ apkName, apkPath, channel }) => ({
      name: apkName,
      localPath: apkPath,
      extra: { channel },
    }));
  }

  async upload(resources: BuildResource[]) {
    const results = [];
    for (let i = 0; i < resources.length; i++) {
      const apk = resources[i];
      const link = await uploadFile(apk.localPath);
        const { channel } = apk.extra;
        const filePath = apk.localPath;
        const fileName = apk.name;
        results.push({ link, filePath, fileName, channel });
    }
    return results;
  }
}
