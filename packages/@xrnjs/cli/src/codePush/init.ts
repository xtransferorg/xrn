#!/usr/bin/env node

import fs from "fs-extra";

import getDefaultBaseLineManager from "./baselineManager";
import { baseRepoManage, diffBundleHash } from "./diff";
import { CodePushDeployment, CodePushParams } from "./typing";
import { getCodePushKeyName } from "./utils";
import { buildBusinessBundle } from "../build/bundle/buildBusinessBundle";
import { getBundleName, getMetaJson } from "../build/bundle/utils";
import { DEFAULT_META_CONFIG } from "../build/constants/meta";
import {
  BuildEnv,
  BuildType,
  BundleType,
  DepInfo,
  Platform,
  RepInfo,
} from "../build/typing";
import { moveResToNative } from "../build/utils/file";
import {
  checkBundleDependencies,
  PackageJson,
  installPackages,
} from "../build/utils/package";
import { execShellCommand } from "../build/utils/shell";
import logger from "../utlis/logger";

export interface CodePushJobParams {
  app: string;
  projectName: string;
  env: BuildEnv;
  platform: Platform;
  version: string;
  isIncrement: boolean;
  isMandatory: string;
  description: string;
  isProd: string;
  uuid?: string;
  whiteList?: string;
  rollout?: string;
  channelReleaseId?: string;
  privateKey?: string;
  isDev?: boolean;
}

export async function codePush(params: CodePushParams) {
  const {
    app,
    projectName,
    branch,
    isIncrement,
    platform,
    desc,
    env,
    appVersion,
    isMandatory,
    uuid,
    rollout,
    whiteList,
    channelReleaseId,
    privateKey,
    isDev,
  } = params;

  // if (isIncrement && env === BuildEnv.preProd) throw Error("预发环境暂不支持增量更新!");
  if (!desc) throw Error("codePush描述字段不能为空");
  if (!branch) throw Error("codePush分支字段不能为空");

  const subBundle: RepInfo = {
    name: projectName,
    branchName: branch.trim(),
    // type: "server",
    gitUrl: "",
    bundleType: BundleType.sub,
  };

  const isProd = " -d Production";
  const jobParams: CodePushJobParams = {
    app,
    projectName,
    env,
    platform,
    version: appVersion,
    isIncrement,
    isMandatory,
    description: desc,
    isProd,
    uuid,
    rollout,
    whiteList,
    channelReleaseId,
    privateKey,
    isDev,
  };
  const homeDirectory = process.cwd();
  logger.debug(
    "当前版本 " + (require("../../package.json") as PackageJson).version,
  );
  logger.debug("传入参数", jobParams);
  const packagePath = homeDirectory;
  //1. 获取原生依赖 2. 如果开启增量更新，为了后续进行diff
  // await initBaseLineRepo(packagePath);

  const manager = getDefaultBaseLineManager({
    app_version: appVersion,
    app_name: app,
    platform,
    channel: channelReleaseId || "china",
    environment: env,
    app_type: "Release",
  });
  await manager.downloadBaseLineToLocal();

  //2. 下载node_modules依赖
  await installPackages(subBundle, packagePath, true);
  // 检查依赖
  await checkDependence(jobParams, projectName);

  //4. RN打包 //内部打包，以及处理10M警告限制
  await packRNBundle(jobParams, subBundle);
}

async function packRNBundle(jobParams: CodePushJobParams, subBundle: RepInfo) {
  const {
    platform,
    version,
    env,
    isMandatory,
    description,
    isProd,
    projectName,
    uuid,
    rollout,
    whiteList,
    channelReleaseId,
    privateKey,
    isDev,
    app,
  } = jobParams;
  const isIos = platform === Platform.iOS;
  const isHarmony = platform === Platform.Harmony;
  let bundlePath = "";
  let repo = null;
  const packagePath = process.cwd();
  // TODO 功能内聚到不同的平台实现
  const meta = !isHarmony
    ? await getMetaJson({
        version,
        platform,
        buildType: BuildType.RELEASE,
        buildEnv: jobParams.env,
        project: app,
      })
    : DEFAULT_META_CONFIG;
  if (isHarmony) {
    bundlePath = `${packagePath}/release_harmony`;
    removeDirAndCreateEmptyDir(bundlePath);
    await buildBusinessBundle({
      platform,
      name: subBundle.name,
      output: bundlePath,
      root: packagePath,
      assetsDest: `${bundlePath}/assets`,
      verbose: env === BuildEnv.dev,
      dev: isDev,
      sourcemapOutput: packagePath,
      meta,
      env,
    });
  } else if (isIos) {
    bundlePath = `${packagePath}/release_ios`;
    removeDirAndCreateEmptyDir(bundlePath);
    await buildBusinessBundle({
      platform,
      name: subBundle.name,
      output: bundlePath,
      root: packagePath,
      assetsDest: `${bundlePath}/`,
      verbose: env === BuildEnv.dev,
      dev: isDev,
      sourcemapOutput: packagePath,
      meta,
      env,
    });
    // packCommand = `npx react-native bundle --reset-cache --entry-file index.ts --platform ios --dev false --bundle-output ${bundlePath}/${subBundle.name}.jsbundle --sourcemap-output ${bundleMapPath}/${subBundle.name}.jsbundle.map --assets-dest ${bundlePath}/`
  } else {
    bundlePath = `${packagePath}/release_android`;
    removeDirAndCreateEmptyDir(bundlePath);
    await buildBusinessBundle({
      platform,
      name: subBundle.name,
      output: bundlePath,
      root: packagePath,
      assetsDest: `${bundlePath}/res/`,
      verbose: env === BuildEnv.dev,
      dev: isDev,
      sourcemapOutput: packagePath,
      meta,
      env,
    });
  }
  // await execShellCommand(packCommand)
  if (env === BuildEnv.prod || env === BuildEnv.preProd) {
    repo = "";
  } else {
    repo = `-${env}`;
  }
  if (jobParams.isIncrement) {
    await codePushDiff2(packagePath, subBundle, jobParams);
  }
  //
  if (Platform.Android === platform) {
    moveResToNative(
      `${packagePath}/release_android/res`,
      `${packagePath}/release_android/`,
    );
    removeDirAndCreateEmptyDir(`${packagePath}/release_android/res`, false);
  }
  let platformUuidOption = "",
    grayReleaseOption = "",
    channelReleaseIdOption = "",
    mPrivateKey = "";
  if (uuid) {
    platformUuidOption = `--uuid ${uuid}`;
  }
  if (rollout) {
    grayReleaseOption = `--rollout ${rollout}`;
    if (whiteList) {
      grayReleaseOption += ` --whiteList ${whiteList}`;
    }
  }
  if (channelReleaseId) {
    channelReleaseIdOption = `--channelReleaseId ${channelReleaseId}`;
  }
  if (privateKey) {
    mPrivateKey = `--privateKeyPath "${privateKey}"`;
  }

  const isProdEnv = env === BuildEnv.prod;
  const codePushKeyName = getCodePushKeyName({
    bundleName: subBundle.name,
    platform,
    buildEnv: env,
    project: jobParams.app,
  });

  const output = await execShellCommand(
    `code-push release ${codePushKeyName} ${bundlePath} ${version} -m ${isMandatory} --bundleName "${getBundleName(platform, subBundle.name)}" --des "${description}" ${isProd} ${platformUuidOption} ${grayReleaseOption} ${channelReleaseIdOption} ${mPrivateKey} --noDuplicateReleaseError ${!isProdEnv}`,
    { cwd: packagePath },
  );
  let packageInfo: {
    label: string;
    package_hash: string;
    description: string;
  };
  try {
    logger.info("热更新发布结果: " + JSON.stringify(output));
    packageInfo = JSON.parse(output.match(/\{[\s\S]*\}/)[0]);
  } catch {
    //
  }
  try {
    await sleep();

    let codePushVersion = packageInfo?.label;
    if (!codePushVersion) {
      logger.info("发布成功，但是返回结果中没有包信息");
      const codePushInfoStr = await execShellCommand(
        `code-push deployment list ${projectName}-${platform}${repo} --format json --showPackage false`,
      );
      const codePushInfo = JSON.parse(
        codePushInfoStr || "",
      ) as CodePushDeployment[];
      logger.info("发布结果" + JSON.stringify(codePushInfo, null, 2));
      codePushVersion = codePushInfo[0]?.package?.label;
    }
    logger.info("codePushVersion: " + codePushVersion);
    packageInfo &&
      logger.info("发布结果" + JSON.stringify(packageInfo, null, 2));
  } catch (error) {
    logger.error(error);
  }
}

async function checkDependence(
  jobParams: CodePushJobParams,
  bundleName: string,
  checkNativeDep = process.env.CHECK_NATIVE_DEP !== "false",
) {
  const root = process.cwd();
  const platform = jobParams.platform;
  const version = jobParams.version;
  const { pkg } = baseRepoManage({
    platform,
    project: jobParams.app,
    version,
    buildEnv: jobParams.env,
    buildType: jobParams.isDev ? BuildType.DEBUG : BuildType.RELEASE,
  });
  const app = jobParams.app;
  if (app.length <= 0) {
    throw new Error(`不存在 codpush diff 目录 ${app}`);
  }
  // 得到iOS和Android的依赖
  const jsonPath = pkg.get();
  logger.info(`校验的依赖路径是: ${jsonPath}`);
  if (!fs.existsSync(jsonPath)) {
    throw new Error("基线中, 不存在native 的 package.json 文件");
  }

  if (checkNativeDep) {
    const nativeDeps = (require(jsonPath) as PackageJson).nativeDeps as Record<
      string,
      DepInfo
    >;

    if (!nativeDeps) {
      throw new Error("基线中不存在完整的原生依赖信息");
    }

    const checkError = await checkBundleDependencies({
      bundlePath: root,
      bundleName,
      nativeDeps,
      platform,
    });

    if (checkError) {
      throw new Error(`校验 ${bundleName} 依赖失败`);
    }
  }
}

function removeDirAndCreateEmptyDir(path: string, isCreate: boolean = true) {
  if (fs.existsSync(path)) {
    fs.rmdirSync(path, { recursive: true });
  }
  if (isCreate) {
    fs.mkdirSync(path);
    fs.chmodSync(path, "755");
  }
}

// 比较两个版本号大小
export function compareVersion(version1: string, version2: string): number {
  const v1: number[] = version1.split(".").map((num) => parseInt(num, 10));
  const v2: number[] = version2.split(".").map((num) => parseInt(num, 10));

  for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
    const num1: number = v1[i] || 0;
    const num2: number = v2[i] || 0;

    if (num1 > num2) {
      return 1;
    } else if (num1 < num2) {
      return -1;
    }
  }
  return 0;
}

async function codePushDiff2(
  packagePath: string,
  subBundle: RepInfo,
  jobParams: CodePushJobParams,
) {
  await diffBundleHash(packagePath, subBundle.name, jobParams);
}

function sleep(ms = 1000) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(null);
    }, ms);
  });
}
