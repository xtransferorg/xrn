import path from "path";
import { COMMON_BASE_KEY, baseRepoManage } from "../../codePush/diff";
import { BuildEnv, BuildType, Platform } from "../typing";
import { buildBusinessBundle } from "./buildBusinessBundle";
import { buildCommonBundle } from "./buildCommonBundle";
import { getBundleName, getMetaJson, isExistDir } from "./utils";
import os from "os";
import fs from "fs/promises";
import { execShellCommand } from "../utils/shell";

export async function buildBundle(options) {
  const {
    platform,
    appVersion,
    dev,
    bundleOutput,
    assetsDest,
    sourcemapOutput,
    name,
    type,
    outputMetaJson,
  } = options;
  const tempBase = path.resolve(os.homedir(), ".xtmp");
  if (type === "biz") {
    const meta = await getMetaJson({
      temp: tempBase,
      version: appVersion,
      platform: platform,
      project: "XTransfer",
      buildType: dev ? BuildType.DEBUG : BuildType.RELEASE,
      buildEnv: BuildEnv.dev,
    });
    await buildBusinessBundle({
      platform: platform,
      name: name,
      output: bundleOutput || `release_${platform}`,
      root: process.cwd(),
      assetsDest: assetsDest || `release_${platform}`,
      verbose: true,
      dev: dev,
      sourcemapOutput: sourcemapOutput || `release_${platform}`,
      meta: meta,
      env: BuildEnv.dev,
    });
  } else {
    const packagePath = process.cwd();
    const commonBundlePath = `${packagePath}/xt-app-common`;
    const meta = await buildCommonBundle({
      platform: platform,
      verbose: true,
      buildEnv: BuildEnv.dev,
      buildType: dev ? BuildType.DEBUG : BuildType.RELEASE,
      version: appVersion,
      project: "XTransfer",
    });
    const metaJson = {
      dependencies: require(path.join(packagePath, "package.json"))
        .dependencies,
      [COMMON_BASE_KEY]: meta,
    };

    if (outputMetaJson) {
      await fs.writeFile(
        path.join(packagePath, outputMetaJson),
        JSON.stringify(metaJson, null, 2),
        "utf-8"
      );
    } else {
      const { pkg, base } = baseRepoManage({
        cwd: tempBase,
        platform: platform,
        project: "XTransfer",
        version: appVersion,
        buildEnv: BuildEnv.dev,
        buildType: dev ? BuildType.DEBUG : BuildType.RELEASE,
      });
      if (!isExistDir(base)) {
        await fs.mkdir(base, { recursive: true });
      }
      await fs.writeFile(pkg.get(), JSON.stringify(metaJson, null, 2), "utf-8");
    }
    if (platform == Platform.iOS) {
      // 拷贝 common bundle
      await execShellCommand(
        `cp ${commonBundlePath}/release_ios/${getBundleName(
          platform
        )} ${packagePath}/release_ios`,
        { cwd: packagePath }
      );
      // 移动 common bundle 资源文件
      await execShellCommand(
        `cp -r ${commonBundlePath}/release_ios/assets ${packagePath}/release_ios`,
        { cwd: packagePath }
      );
    } else {
      // 拷贝 common bundle
      await execShellCommand(
        `cp ${commonBundlePath}/release_android/${getBundleName(
          platform
        )} ${packagePath}/android/app/src/main/assets`,
        { cwd: packagePath }
      );
      // 移动 common bundle 资源文件
      await execShellCommand(
        `cp -r ${commonBundlePath}/release_android/res ${packagePath}/android/app/src/main`,
        { cwd: packagePath }
      );
    }
  }
}
