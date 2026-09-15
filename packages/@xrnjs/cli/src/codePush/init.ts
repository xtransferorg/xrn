#!/usr/bin/env node

import { BuildEnv, BuildType, BundleType, DepInfo, Platform } from '../build/typing';
import { RepInfo } from '../build/typing';
import { PackageJson } from '../build/utils/package';
import { checkBundleDependencies } from '../build/utils/bundleDependencies';
import { execShellCommand } from "../build/utils/shell"
import fs from 'fs-extra';
import { CodePushDeployment, CodePushParams } from './typing';
import { COMMON_BASE_KEY, diffBundleHash, generateBundleResourceBaseLine } from './diff';
import { moveResToNative } from '../build/utils/file';
import { buildBusinessBundle } from '../build/bundle/buildBusinessBundle';
import { getBundleMapName, getBundleName } from '../build/bundle/utils';
import logger from '../utlis/logger';
import path from 'path';
import { installPackages } from '../build/utils/package';
import { checkXtRnCoreVersion } from '../utlis/checkDependenciesInRange';
import { baselineSdk, codePushSdk, AccountSdk } from '@xrnjs/code-push-cli';
import { BaseLineFileType, NativeAppType } from '@xrnjs/code-push-core/dist/types';
import { MetaConfig } from '../build/bundle/interface';
import { BaselineManagerFactory } from '../build/BaselineManagerFactory';
import { codePushContext } from './codePushContext';

export interface CodePushJobParams {
  app: string,
  projectName: string;
  env: BuildEnv;
  platform: Platform;
  version: string;
  isIncrement: boolean;
  isMandatory: string;
  description: string;
  uuid?: string;
  whiteList?: string;
  rollout?: string;
  channelReleaseId?: string;
  privateKey?: string;
  isDev?: boolean;
  versionParts: string[]
}

export async function codePush(params: CodePushParams) {
  const { app, projectName, branch, isIncrement, platform, desc, env, appVersion, isMandatory, uuid, rollout, whiteList, channelReleaseId, skipCheckXtRnCoreVersion, privateKey, isDev, versionParts } = params

  // if (isIncrement && env === BuildEnv.preProd) throw Error("预发环境暂不支持增量更新!");
  if (!desc) throw Error("codePush描述字段不能为空");
  if (!branch) throw Error("codePush分支字段不能为空");

  const subBundle: RepInfo = {
    name: projectName,
    branchName: branch.trim(),
    // type: "server",
    gitUrl: "",
    bundleType: BundleType.sub
  }

  const jobParams: CodePushJobParams = {
    app,
    projectName: projectName,
    env: env,
    platform: platform,
    version: appVersion,
    isIncrement: isIncrement,
    isMandatory: isMandatory,
    description: desc,
    uuid: uuid,
    rollout: rollout,
    whiteList: whiteList,
    channelReleaseId: channelReleaseId,
    privateKey: privateKey,
    isDev,
    versionParts
  }
  const homeDirectory = process.cwd();
  const packageJson = require(path.join(homeDirectory, "package.json")) as PackageJson;
  logger.info("当前版本 " + packageJson.version)
  logger.info("传入参数", jobParams)
  const packagePath = homeDirectory

  const baselineManager = BaselineManagerFactory.createOrGet({
    platform,
    buildEnv: env,
    buildType: BuildType.RELEASE,
    version: appVersion,
  })
  codePushContext.baselineManager = baselineManager

  //1. 获取原生依赖 2. 如果开启增量更新，为了后续进行diff
  baselineManager.cleanBaselineDir();
  await baselineManager.downloadFiles({
    excludeFileTypes: [BaseLineFileType.BASE_PACKAGE, BaseLineFileType.BUNDLE_BUILD_PRODUCT],
    filter: (item) => {
      if (
        item.file_type === BaseLineFileType.BUNDLE_RESOURCE ||
        item.file_type === BaseLineFileType.HBC_BASELINE
      ) {
        return item.file_name.startsWith(projectName);
      }
      return true;
    },
  });
  //2. 下载node_modules依赖
  await installPackages(subBundle, packagePath, true);
  // 检查依赖
  await checkDependence(jobParams, projectName, skipCheckXtRnCoreVersion, process.env.CHECK_NATIVE_DEP !== 'false')

  //3. RN打包 //内部打包，以及处理10M警告限制
  await packRNBundle(jobParams, subBundle);
}

async function packRNBundle(jobParams: CodePushJobParams, subBundle: RepInfo) {
  const { platform, version, env, isMandatory, description, projectName, uuid, rollout, whiteList, channelReleaseId, privateKey, isDev, versionParts } = jobParams
  const isIos = platform == Platform.iOS;
  const isHarmony = platform == Platform.Harmony;
  let bundlePath = ''
  let repo = null
  const packagePath = process.cwd();
  const { baselineManager } = codePushContext
  const { pkg } = baselineManager.baseRepoManage()

  const meta: MetaConfig = (require(pkg.get()) as PackageJson)[COMMON_BASE_KEY] as MetaConfig
  // 获取 HBC_BASELINE 路径（若已下载则传入 hermesc -base-bytecode，否则退化为普通编译）
  let baseBytecodeFilePath: string | undefined;
  const hbcBaselineInfo = baselineManager.getBundleBaselineInfo(subBundle.name, BaseLineFileType.HBC_BASELINE);
  if (fs.existsSync(hbcBaselineInfo.filePath)) {
    baseBytecodeFilePath = hbcBaselineInfo.filePath;
    logger.info(`[HBC_BASELINE] 使用 base-bytecode: ${baseBytecodeFilePath}`);
  } else {
    logger.warn(`[HBC_BASELINE] 未找到 ${subBundle.name} 的 HBC_BASELINE 基线文件，将跳过 -base-bytecode（仅动态bundle首次热更新允许）`);
  }

  if (isHarmony) {
    bundlePath = `${packagePath}/release_harmony`
    removeDirAndCreateEmptyDir(bundlePath)
    {
      await buildBusinessBundle({
        platform: platform,
        name: subBundle.name,
        output: bundlePath,
        root: packagePath,
        assetsDest: `${bundlePath}/assets`,
        verbose: env === BuildEnv.dev,
        dev: isDev,
        sourcemapOutput: packagePath,
        meta: meta,
        env: env,
        baseBytecodeFilePath,
      })
    }
  } else if (isIos) {
    bundlePath = `${packagePath}/release_ios`
    removeDirAndCreateEmptyDir(bundlePath)
    {
      await buildBusinessBundle({
        platform: platform,
        name: subBundle.name,
        output: bundlePath,
        root: packagePath,
        assetsDest: `${bundlePath}/`,
        verbose: env === BuildEnv.dev,
        dev: isDev,
        sourcemapOutput: packagePath,
        meta: meta,
        env: env,
        baseBytecodeFilePath,
      })
    }
    // packCommand = `npx react-native bundle --reset-cache --entry-file index.ts --platform ios --dev false --bundle-output ${bundlePath}/${subBundle.name}.jsbundle --sourcemap-output ${bundleMapPath}/${subBundle.name}.jsbundle.map --assets-dest ${bundlePath}/`
  } else {
    bundlePath = `${packagePath}/release_android`
    removeDirAndCreateEmptyDir(bundlePath)
    {
      await buildBusinessBundle({
        platform: platform,
        name: subBundle.name,
        output: bundlePath,
        root: packagePath,
        assetsDest: `${bundlePath}/res/`,
        verbose: env === BuildEnv.dev,
        dev: isDev,
        sourcemapOutput: packagePath,
        meta: meta,
        env: env,
        baseBytecodeFilePath,
      })
    }
  }
  // await execShellCommand(packCommand)
  if (env === BuildEnv.prod || env === BuildEnv.preProd) {
    repo = "";
  } else {
    repo = `-${env}`;
  }
  const bundleInfo = await baselineSdk.getBundleInfo({ bundleName: subBundle.name, env: env, platform, buildType: NativeAppType.RELEASE });
  if (!bundleInfo) {
    logger.info("未找到版本 ${subBundle.name}-${platform}-${env} 的 bundle 信息")
  }
  logger.info(`bundleInfo: ${JSON.stringify(bundleInfo, null, 2)}`)
  const { filePath: bundleResourceBaselinePath } = baselineManager.getBundleBaselineInfo(subBundle.name, BaseLineFileType.BUNDLE_RESOURCE)
  const codePushAppName = `${projectName}-${platform}${repo}`
  const isFirstCodePush = await baselineSdk.checkFirstCodepush(codePushAppName, version, BuildType.RELEASE)
  const appResourceBaselinePath = baselineManager.baseRepoManage().resources.get()
  const dynamic = bundleInfo.deliveryType === 'DYNAMIC';
  const dynamicBundleFirstCodePush = dynamic && isFirstCodePush;
  // const dynamicBundleFirstCodePush = true;

  // 非"动态 bundle 首次热更新"时，必须存在 HBC_BASELINE 基线，否则无法使用 -base-bytecode 压缩 diff 体积
  if (!baseBytecodeFilePath && !dynamicBundleFirstCodePush) {
    throw new Error(`[HBC_BASELINE] 未找到 ${subBundle.name} 的 HBC_BASELINE 基线文件，非动态 bundle 首次热更新时必须提供该基线`);
  }

  if (dynamicBundleFirstCodePush) {
    logger.info("动态 bundle 首次热更新")

    if (isMandatory !== "true") {
      throw new Error("动态 bundle 首次热更新必须强制热更新")
    }

    // 生成 bundle 资源基线
    {
      await generateBundleResourceBaseLine(subBundle.name, bundlePath, baselineManager)
    }
  } else {
    logger.info("bundle 非首次热更新")
  }

  // 生成 baseline
  if (jobParams.isIncrement) {
    let resourcePath = appResourceBaselinePath
    if (dynamic) {
      if (dynamicBundleFirstCodePush) {
        resourcePath = appResourceBaselinePath // 动态 bundle 首次热更新，使用 app 资源基线
      } else {
        resourcePath = bundleResourceBaselinePath // 动态 bundle 非首次热更新，使用 bundle 资源基线
      }
    }
    {
      // harmony 内置包多了一个 assets 目录，需要特殊处理，当实际使用内置包资源作为 diff 基线时，需要添加一个 'assets' 目录，appResourceBaselinePath：内置包的资源路径
      const harmonyAssets = resourcePath === appResourceBaselinePath ? "/assets" : undefined;
      await diffBundleHash(packagePath, subBundle.name, jobParams, codePushContext.baselineManager, resourcePath, harmonyAssets)
    }
  }
  // baselineSdk.addDynamicBaseline()
  //
  if (Platform.Android === platform) {
    await moveResToNative(`${packagePath}/release_android/res`, `${packagePath}/release_android/`)
    removeDirAndCreateEmptyDir(`${packagePath}/release_android/res`, false)
  }

  const versionRange = versionParts.length > 1 ? `${versionParts[0]}-${versionParts[versionParts.length - 1]}` : undefined

  const isProdEnv = env === BuildEnv.prod
  const noDuplicateReleaseError = !isProdEnv
  const packageInfo = await codePushSdk.releasePackage(bundlePath, privateKey, codePushAppName, "Production", versionRange || version, {
    description,
    isMandatory: isMandatory === "true",
    bundleName: getBundleName(platform, subBundle.name),
    uuid,
    rollout: rollout && !isNaN(Number(rollout)) ? Number(rollout) : undefined,
    whiteList,
    channelReleaseId,
    appBinaryTime: dynamicBundleFirstCodePush ? Date.now().toString() : undefined,
    commonHash: meta.hash
  }, noDuplicateReleaseError)
  if (dynamicBundleFirstCodePush) {
    try {
      await baselineManager.moveFileToTempDir(BaseLineFileType.BASE_PACKAGE, packageInfo.packagePath, subBundle.name, {
        autoGenerateHash: false,
        rename: `release_${platform}.zip`,
        dirName: subBundle.name,
        hash: packageInfo.packageHash
      });
      // 首次热更新同时上传 HBC_BASELINE，供后续热更新使用 -base-bytecode 压缩 diff 体积
      const hbcFilePath = path.join(bundlePath, getBundleName(platform, subBundle.name));
      if (fs.existsSync(hbcFilePath)) {
        const hbcInfo = baselineManager.getBundleBaselineInfo(subBundle.name, BaseLineFileType.HBC_BASELINE);
        await baselineManager.moveFileToTempDir(BaseLineFileType.HBC_BASELINE, hbcFilePath, subBundle.name, {
          rename: hbcInfo.fileName,
          dirName: subBundle.name,
        });
        logger.info(`[HBC_BASELINE] 已注册动态 bundle HBC 基线: ${hbcInfo.filePath}`);
      } else {
        logger.warn(`[HBC_BASELINE] 动态 bundle HBC 文件不存在，跳过注册: ${hbcFilePath}`);
      }
      {
        await baselineManager.uploadFiles({
          platform,
          version_name: version,
          app_type: NativeAppType.RELEASE,
          env: env,
        }, [BaseLineFileType.BASE_PACKAGE, BaseLineFileType.HBC_BASELINE, BaseLineFileType.BUNDLE_RESOURCE]);
      }
    } catch (error) {
      logger.error(`基线上传失败: ${error instanceof Error ? error.message : String(error)}`)
      // 报错时，禁用该版本的热更新
      logger.info(`基线上传失败，禁用 ${codePushAppName} 的 ${packageInfo.label} 版本的热更新`)
      await AccountSdk.patchRelease(codePushAppName, "Production", packageInfo.label, {
        isDisabled: true,
        description: "基线上传失败，禁用该版本的热更新"
      })
      throw error;
    }
  }

  try {
    fs.removeSync(packageInfo.packagePath)
    await sleep()

    let codePushVersion = packageInfo?.label
    if (!codePushVersion) {
      logger.info('发布成功，但是返回结果中没有包信息')
      const codePushInfoStr = await execShellCommand(`code-push deployment list ${projectName}-${platform}${repo} --format json --showPackage false`)
      const codePushInfo = JSON.parse(codePushInfoStr || "") as CodePushDeployment[]
      logger.info('发布结果' + JSON.stringify(codePushInfo, null, 2))
      codePushVersion = codePushInfo[0]?.package?.label
    }
    logger.info("codePushVersion: " + codePushVersion)
    packageInfo && logger.info('发布结果' + JSON.stringify(packageInfo, null, 2))

  } catch (error) {
    logger.error(error);
  }
}

async function checkDependence(jobParams: CodePushJobParams, bundleName: string, skipCheckXtRnCoreVersion: boolean, checkNativeDep = process.env.CHECK_NATIVE_DEP !== 'false') {
  const root = process.cwd()
  const platform = jobParams.platform
  const version = jobParams.version
  const { pkg } = codePushContext.baselineManager.baseRepoManage()
  const app = jobParams.app
  if (app.length <= 0) {
    throw new Error(`不存在 codpush diff 目录 ${app}`);
  }
  // 得到iOS和Android的依赖
  const jsonPath = pkg.get()
  logger.info(`校验的依赖路径是: ${jsonPath}`);
  if (!fs.existsSync(jsonPath)) {
    throw new Error("基线中, 不存在native 的 package.json 文件")
  }


  if (checkNativeDep) {
    const nativeDeps = (require(jsonPath) as PackageJson).nativeDeps as Record<string, DepInfo>
    const reactNativeConfigDeps = (require(jsonPath) as PackageJson).reactNativeConfigDeps as Record<string, DepInfo>
    const dependencies = (require(jsonPath) as PackageJson).dependencies
    if (!nativeDeps) {
      throw new Error("基线中不存在完整的原生依赖信息")
    }

    const checkError = await checkBundleDependencies({
      bundlePath: root,
      bundleName,
      nativeDeps,
      platform,
      reactNativeConfigDeps,
      checkLevel: 'minor',
      allowNewPackage: false,
      allowBundleVersionLowerThanNative: false,
      dependencies
    })

    if (checkError) {
      throw new Error(`校验 ${bundleName} 依赖失败`);
    }
  }

  if (!skipCheckXtRnCoreVersion) {
    // 校验@xrnjs/core依赖
    checkXtRnCoreVersion({
      appVersion: version,
      bundleName: bundleName,
      projectPath: root,
    })
  }
}


function removeDirAndCreateEmptyDir(path: string, isCreate: boolean = true) {
  if (fs.existsSync(path)) {
    fs.rmdirSync(path, { recursive: true })
  }
  if (isCreate) {
    fs.mkdirSync(path)
    fs.chmodSync(path, '755');
  }

}

function sleep(ms = 1000) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(null);
    }, ms);
  });
}
