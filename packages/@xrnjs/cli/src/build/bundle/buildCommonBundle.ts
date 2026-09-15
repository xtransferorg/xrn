/* eslint-disable @typescript-eslint/no-unsafe-argument */
import type { MetaConfig } from "./interface";
import { BuildEnv, BuildType, Platform } from "../typing";
import { execBuildCore } from "./module";
import { EntryFileName } from "./constant";
import { getBundleName, getFileHash } from "./utils";
import logger from "../../utlis/logger";
import path from "path";
import fs from "fs-extra";
import { isProd } from "../utils";
import { removeDirAndCreateEmptyDir } from "../utils/file";

interface BuildCommonBundleConfig {
  platform: Platform;
  verbose: boolean;
  base?: string;
  buildEnv: BuildEnv;
  buildType: BuildType;
  hermes?: boolean;
}

export async function buildCommonBundle({
  platform,
  verbose,
  buildType,
  buildEnv,
  hermes = true,
  base = process.cwd(),
}: BuildCommonBundleConfig): Promise<MetaConfig> {
  if(isProd(buildEnv)) {
    process.env.ENV_NAME = 'prod';
  }
  const basePath = path.resolve(base, "xt-app-common"); // 生成一个临时目录，作为 common 构建的目录
  logger.info(`创建 common bundle 项目，临时目录: ${basePath}`);
  removeDirAndCreateEmptyDir(basePath);
  fs.ensureDirSync(path.join(basePath, `release_${platform}`));
  await fs.writeFile(
    path.resolve(basePath, EntryFileName),
    "import '@xrnjs/core/common-bundle'"
  );
  await fs.writeFile(
    path.resolve(base, "babel.config.js"),
    `module.exports = {
  extends: "@xrnjs/core/app-config/babel.config.js",
};`
  );

  logger.info("开始构建 common bundle");
  const output = path.resolve(basePath, `release_${platform}`);
  const previousDeepImportSetting = process.env.XRN_ENABLE_DEEP_IMPORT;
  process.env.XRN_ENABLE_DEEP_IMPORT = "false";
  try {
    await execBuildCore("core/common.js", {
      platform: platform,
      bundleName: getBundleName(platform),
      output: output,
      basePath: basePath,
      rootPath: base,
      verbose: verbose ? "1" : "0",
      dev: buildType === BuildType.DEBUG ? "1" : "0",
      hermes: hermes ? "1" : "0",
      assetsDest:
        platform === Platform.iOS
          ? path.resolve(output)
          : path.resolve(output, "res"),
    });
  } finally {
    if (previousDeepImportSetting === undefined) {
      Reflect.deleteProperty(process.env, "XRN_ENABLE_DEEP_IMPORT");
    } else {
      process.env.XRN_ENABLE_DEEP_IMPORT = previousDeepImportSetting;
    }
  }
  logger.info("构建结束 common bundle");

  const metaJson = JSON.parse(
    await fs.readFile(path.resolve(base, `${platform}.meta.json`), "utf-8")
  ) as MetaConfig;

  // 计算 bundle 内容的 hash 并存放在基线中
  const hash = await getFileHash(
    path.resolve(basePath, `release_${platform}`, getBundleName(platform))
  );

  metaJson.hash = hash;
  metaJson.version = "1.0.0";

  // 检查模块是否有版本未找到，未找到则应该报错
  Object.entries(metaJson.modules).some(([key, item]) => {
    if (item.version === "0.0.0") {
      throw new Error(`${key} 版本号不能为 0.0.0`);
    }
  });

  return metaJson;
}
