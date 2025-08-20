import { buildiOSApp } from "../ios/buildIOSApp";
import { uploadFile, manifestPrefix } from "../utils/ftp";
import { BuildEnv, BuildType } from "../typing";
import { isProd } from "../utils";
import { COMMON_BASE_KEY } from "../../codePush/diff";
import fs from "fs-extra";
import path from "path";
import { BuildResource, BaseBuilder } from "./BaseBuilder";
// import { uploadIOSArchive } from "../ios/uploadIOSArchive";
// import logger from "../../utlis/logger";

export class IOSBuilder extends BaseBuilder {

  async build(): Promise<BuildResource[]> {
    const { buildEnv, buildType, iosSimulator, rootPath } = this.context;
    if (iosSimulator) {
    }
    if (buildType === BuildType.DEBUG && !isProd(buildEnv)) {
      const metaJson = {
        dependencies: require(path.join(rootPath, "package.json")).dependencies,
        [COMMON_BASE_KEY]: this.meta,
      };
      await fs.writeFile(
        path.resolve(rootPath, "release_ios/assets/manifest.json"),
        JSON.stringify(metaJson),
        "utf-8"
      );
    }
    const { apkName, apkPath, apkManifestPath, minor_version } = await buildiOSApp();
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
      await uploadFile(apk.localPath);
      link = await uploadFile(manifest.localPath);
      link = manifestPrefix + link;
      // logger.info("iOS ftp 🐷下载地址: ", link);
    } else {
      link = await uploadFile(apk.localPath);
    }
    // await uploadIOSArchive(apk.extra?.minor_version);
    return [{ link, filePath: apk.localPath, fileName: apk.name, channel: this.context.channel }];
  }
} 