import path from "path";
import { COMMON_BASE_KEY } from "../../codePush/diff";
import { BuildEnv, BuildType, Platform } from "../typing";
import { buildBusinessBundle } from "./buildBusinessBundle";
import { buildCommonBundle } from "./buildCommonBundle";
import { getBundleName, getMetaJson, isExistDir } from "./utils";
import os from "os";
import fs from "fs/promises";
import { execShellCommand } from "../utils/shell";
import { readPackageJsonSync, PackageJson } from "../utils/package";
import logger from "../../utlis/logger";
import { BaselineManagerFactory } from "../BaselineManagerFactory";

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
    const baselineManager = BaselineManagerFactory.createOrGet({
      platform: platform,
      buildEnv: BuildEnv.dev,
      buildType: dev ? BuildType.DEBUG : BuildType.RELEASE,
      version: appVersion,
    })
    
    // 完善 localProjects 逻辑
    const localProjects: Record<string, PackageJson> = {};
    
    try {
      // 读取 packagePath 下的所有文件夹
      const entries = await fs.readdir(packagePath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const folderName = entry.name;
          
          // 过滤出 xt-app- 开头的文件夹，但排除 xt-app-common
          if (folderName.startsWith('xt-app-') && folderName !== 'xt-app-common') {
            const folderPath = path.join(packagePath, folderName);
            const packageJsonPath = path.join(folderPath, 'package.json');
            
            try {
              // 检查是否存在 package.json 文件
              await fs.access(packageJsonPath);
              
              // 读取并解析 package.json
              const packageJson = readPackageJsonSync(folderPath);
              localProjects[folderName] = packageJson;
              
              logger.info(`发现本地项目: ${folderName}, 版本: ${packageJson.version}`);
            } catch (error) {
              logger.warn(`跳过文件夹 ${folderName}: 无法读取 package.json`);
            }
          }
        }
      }
      
      logger.info(`共发现 ${Object.keys(localProjects).length} 个本地 xt-app- 项目`);
    } catch (error) {
      logger.error(`扫描本地项目时出错: ${error.message}`);
    }
    
    const meta = await buildCommonBundle({
      platform: platform,
      verbose: true,
      buildType: dev ? BuildType.DEBUG : BuildType.RELEASE,
      buildEnv: BuildEnv.dev,
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
      const { pkg, base } = baselineManager.baseRepoManage();
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
