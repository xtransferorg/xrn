import fs from "fs-extra";
import path from "path";

import getDefaultBaseLineManager from "./baselineManager";
import { codePushContext } from "./codePushContext";
import { CodePushJobParams } from "./init";
import { buildJobContext } from "../build/BuildJobContext";
import type { MetaConfig } from "../build/bundle/interface";
import { getBundleMapName, getBundleName } from "../build/bundle/utils";
import { BuildEnv, BuildType, JobParams, Platform } from "../build/typing";
import { getBundleBaseLines } from "../build/utils/file";
import { PackageJson } from "../build/utils/package";
import { execShellCommand } from "../build/utils/shell";
import logger from "../utlis/logger";

/*
分离每个bundle 的基线:
1. 先拉取 code-push-diff 仓库
2. 根据不同的bundle生成不同的baseline文件
*/

export const name = "xt-app-code-push-diff";
export const branch = "main";
export const COMMON_BASE_KEY = "commonBaseLine";

export function convertBaseLineEnv(platform: Platform, buildEnv: BuildEnv) {
  // if (platform == Platform.Android) {
  // return (buildEnv == BuildEnv.preProd || buildEnv == BuildEnv.prod) ? BuildEnv.prod : buildEnv
  // }
  return buildEnv === BuildEnv.preProd || buildEnv === BuildEnv.prod
    ? BuildEnv.prod
    : BuildEnv.dev;
}

const getBaselineManager = () => {
  const manager = getDefaultBaseLineManager({
    app_version: buildJobContext.version,
    app_name: buildJobContext.project,
    platform: buildJobContext.platform,
    channel: buildJobContext.channel,
    environment: buildJobContext.buildEnv,
    appKey: buildJobContext.appKey,
    app_type:
      buildJobContext.buildType === BuildType.RELEASE ? "Release" : "Debug",
  });
  return manager;
};

export const cleanBaseLineFile = async (rootPath: string) => {
  await execShellCommand(
    `rm -rf ${path.join(rootPath, name)}`,
    { cwd: rootPath, log: false },
    true,
  );
};

// export async function initBaseLineRepo(packagePath: string, b = branch) {
//   await cleanBaseLineFile(packagePath);
//   const manager = getBaselineManager();
//   await manager.downloadBaseLineToLocal();
//   // const diffRepoInfo = {
//   //   name,
//   //   branchName: b,
//   //   gitUrl: `git@atta-gitlab.xtrfr.cn:atta-team/fe/app/${name}.git`,
//   // };
//   // await execShellCommand(
//   //   `rm -rf ${diffRepoInfo.name}`,
//   //   { cwd: packagePath, log: false },
//   //   true
//   // );
//   // await gitclone(diffRepoInfo.gitUrl, `${packagePath}/${diffRepoInfo.name}`, {
//   //   checkout: diffRepoInfo.branchName,
//   //   shallow: false,
//   // });
// }

export async function generateAndUploadBaseline() {
  const { rootPath } = buildJobContext;
  // 生成原生基线依赖和 common meta 文件
  generateNativeBaseLine(rootPath, buildJobContext.meta);

  // 鸿蒙基线暂不处理
  if (buildJobContext.platform !== Platform.Harmony) {
    await moveCommonBundleToBaseLine(rootPath, buildJobContext);
  }

  if (buildJobContext.buildType === BuildType.RELEASE) {
    await generateSvgBaseLine(rootPath, buildJobContext);
  }
  const manager = getBaselineManager();
  await manager.uploadBaseLine();
}

export async function generateBusinessBaseLine(
  packagePath: string,
  bundleName: string,
  jobParams: JobParams,
) {
  const script_root = path.resolve(__dirname, "../../");

  const app = jobParams.project;
  if (app.length <= 0) {
    throw new Error(`不存在 codepush diff 目录 ${app}`);
  }
  const version = jobParams.version;
  const environment = convertBaseLineEnv(
    jobParams.platform,
    jobParams.buildEnv,
  );
  const platform = jobParams.platform;
  const basePath = `${packagePath}/${name}/${app}/${version}/${bundleName}`;
  const bundleHashFile = `${basePath}/${environment}-${platform}-baseline.txt`;
  const currentHashFile = `${basePath}/${environment}-${platform}-current.txt`;
  logger.debug(`bundleHashFile 路径是: ${bundleHashFile}`);
  logger.debug(`currentHashFile 路径是: ${currentHashFile}`);
  // 注入shell变量
  process.env.code_folder = packagePath;
  // 获取资源集合目录
  process.env.code_push_dir =
    bundleName === "xt-package-xrn"
      ? `${packagePath}/${bundleName}/example/release_${platform}`
      : `${packagePath}/${bundleName}/release_${jobParams.platform}`;
  process.env.app = app;
  process.env.platform = platform;
  process.env.version = version;
  process.env.environment = environment;
  process.env.bundleHashFile = bundleHashFile;

  // 不存在该basePath目录, 就创建一个这样的basePath目录
  if (!fs.existsSync(basePath)) {
    fs.mkdirSync(basePath, { recursive: true });
  }

  await execShellCommand(`rm -rf ${bundleHashFile}`);
  const out = await execShellCommand(
    `source codepush_diff.sh && createBundleHash $code_push_dir ""`,
    { cwd: `${script_root}/files` },
  );
  if (buildJobContext.verbose) {
    logger.info(out);
  }
}

export function generateNativeBaseLine(packagePath: string, meta: MetaConfig) {
  logger.debug(`生成基线, 原生项目路径是: ${packagePath}`);
  // 获取iOS/Android 项目的 package.json 存入基线
  const nativePackageJson = `${packagePath}/package.json`;
  if (!fs.existsSync(nativePackageJson)) {
    throw new Error("生成基线, 但是原生项目不存在package.json文件");
  }
  const pkgNative = require(nativePackageJson) as PackageJson;
  const { pkg } = baseRepoManage({
    cwd: packagePath,
    platform: buildJobContext.platform,
    project: buildJobContext.project,
    version: buildJobContext.version,
    buildEnv: buildJobContext.buildEnv,
    buildType: buildJobContext.buildType,
  });
  fs.ensureFileSync(pkg.get());
  // 生成基线的 package.json 文件
  fs.writeFileSync(
    pkg.get(),
    JSON.stringify(
      {
        dependencies: pkgNative.dependencies,
        nativeDeps: buildJobContext.nativeDeps,
        [COMMON_BASE_KEY]: meta,
      },
      null,
      2,
    ),
    "utf-8",
  );
}

export async function generateSvgBaseLine(
  packagePath: string,
  jobParams: JobParams,
) {
  const svgMap = new Map<string, string>();
  const { base, raw } = baseRepoManage({
    cwd: packagePath,
    platform: jobParams.platform,
    project: jobParams.project,
    version: jobParams.version,
    buildEnv: jobParams.buildEnv,
    buildType: jobParams.buildType,
  });
  const environment = convertBaseLineEnv(
    jobParams.platform,
    jobParams.buildEnv,
  );
  const platform = jobParams.platform;
  // 扫描所有bundle的基线文件
  const baseLineFiles: string[] = await getBundleBaseLines(
    base,
    environment,
    platform,
  );

  baseLineFiles.forEach((filePath) => {
    try {
      const fileContent = fs.readFileSync(filePath, "utf-8");
      const lines = fileContent.split("\n");

      const newFileContent: string[] = [];
      lines.forEach((line) => {
        if (line.includes(".svg")) {
          const [filePathPart, md5Part] = line
            .replace(/^\s+|\s+$/g, "")
            .split(" ");
          if (filePathPart && md5Part && !svgMap.has(filePathPart)) {
            svgMap.set(filePathPart, md5Part);
          }
        } else {
          newFileContent.push(line);
        }
      });
      fs.writeFileSync(filePath, newFileContent.join("\n"), "utf-8");
    } catch (error) {
      logger.error(`处理${filePath}报错:`, error);
    }
  });

  try {
    const deduplicatedSvgLines = Array.from(svgMap.entries()).map(
      // 空格是故意留的，因为在codepush diff的时候有规则匹配
      ([filePathPart, md5Part]) => ` ${filePathPart} ${md5Part}`,
    );
    fs.writeFileSync(raw.get(), deduplicatedSvgLines.join("\n"), "utf-8");
    logger.debug(`去重后的 SVG 行已合并到目标文件: ${raw.get()}`);
  } catch (error) {
    logger.error(`写入文件错误 ${raw.get()} :`, error);
  }
}

export async function moveCommonBundleToBaseLine(
  packagePath: string,
  cliJobParams: JobParams,
) {
  const { buildEnv, buildType, platform, project, version } = cliJobParams;
  if (buildEnv !== BuildEnv.prod || buildType === BuildType.DEBUG) {
    // debug 包不上传 common bundle
    // 非生产环境不上传 common bundle
    return;
  }
  const commonBundlePath = path.resolve(packagePath, "xt-app-common");
  const baseLinePath = path.resolve(packagePath, name, project, version);
  // 拷贝 common bundle 到基线中
  await execShellCommand(
    `cp ${commonBundlePath}/release_${platform}/${getBundleName(platform)} ${baseLinePath}`,
    { cwd: packagePath },
  );
  await execShellCommand(
    `cp ${commonBundlePath}/release_${platform}/${getBundleMapName(platform)} ${baseLinePath}`,
    { cwd: packagePath },
  );
}

export async function diffBundleHash(
  packagePath: string,
  bundleName: string,
  jobParams: CodePushJobParams,
) {
  const script_root = path.resolve(__dirname, "../../");

  const app = jobParams.app;
  if (app.length <= 0) {
    throw new Error(`不存在 codpush diff 目录 ${app}`);
  }
  const version = jobParams.version;
  const environment = convertBaseLineEnv(jobParams.platform, jobParams.env);
  const platform = jobParams.platform;
  const basePath = `${packagePath}/${name}/${app}/${version}/${bundleName}`;
  const bundleHashFile = `${basePath}/${environment}-${platform}-baseline.txt`;
  const currentHashFile = `${basePath}/${environment}-${platform}-current.txt`;
  logger.debug(`bundleHashFile 路径是: ${bundleHashFile}`);
  logger.debug(`currentHashFile 路径是: ${currentHashFile}`);
  // 注入shell变量
  process.env.code_folder = packagePath;
  // 获取资源集合目录
  process.env.code_push_dir = `${packagePath}/release_${jobParams.platform}`;
  process.env.app = app;
  process.env.platform = platform;
  process.env.version = version;
  process.env.environment = environment;
  process.env.bundleHashFile = bundleHashFile;
  process.env.currentHashFile = currentHashFile;
  process.env.harmonyAssets = "";

  if (jobParams.platform === Platform.Harmony) {
    process.env.harmonyAssets = "/assets";
  }

  if (!fs.existsSync(bundleHashFile)) {
    throw new Error(
      `[ERROR] Bundle hash baseline file: ${bundleHashFile} does not exist. Please check.`,
    );
  }
  logger.debug(`Bundle hash file is ${bundleHashFile}`);
  logger.debug(`Building bundle output to ${process.env.code_push_dir}`);
  // 清空currentHashFile，不存在则创建一个空文件currentHashFile。 因此每次code push 发更新包，都需要重新生成当次的 currentHashFile
  // currentHashFile 的意义仅仅在于当次codepush diff比对 【其实完全可以当次比对完成之后，直接remove掉，暂时先留这儿吧】
  fs.writeFileSync(currentHashFile, "", "utf-8");

  // 对图片进行比对
  await execShellCommand(
    `source ${script_root}/files/codepush_diff.sh && diffBundleHash $code_push_dir ""`,
    { cwd: `${script_root}/files` },
  );
  // 对svg进行比对 bundleHashFile替换为全局的svg基线比对
  const svgBaseLineFile = `${packagePath}/${name}/${app}/${version}/${environment}-${platform}-raw-baseline.txt`;
  process.env.bundleHashFile = svgBaseLineFile;
  await execShellCommand(
    `source ${script_root}/files/codepush_diff.sh && diffBundleHash $code_push_dir ""`,
    { cwd: `${script_root}/files` },
  );
}

export async function commitDiffHash(
  packagePath: string,
  jobParams: JobParams | CodePushJobParams,
) {
  logger.info(`开始提交基线`);
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = (currentDate.getMonth() + 1).toString().padStart(2, "0"); // 月份是从 0 开始的，需要加 1
  const day = currentDate.getDate().toString().padStart(2, "0");
  const hours = currentDate.getHours().toString().padStart(2, "0");
  const minutes = currentDate.getMinutes().toString().padStart(2, "0");

  const timestamp = `${year}${month}${day}${hours}${minutes}`;

  const appProject =
    (jobParams as JobParams).project || (jobParams as CodePushJobParams).app;
  const app = appProject;
  if (app.length <= 0) {
    throw new Error(`不存在 codepush diff 目录 ${app}`);
  }
  const version = jobParams.version;
  const buildEnv = (jobParams as JobParams).buildEnv;
  const env = (jobParams as CodePushJobParams).env;
  let environment = buildEnv ? buildEnv : env;
  if (!environment) {
    throw new Error(
      "prepare commit diff hash, but environment is not exist!!!",
    );
  }
  environment = convertBaseLineEnv(jobParams.platform, environment);

  const platform = jobParams.platform;

  const diffRepoPath = `${packagePath}/${name}`;
  const status: string = await execShellCommand(`git status`, {
    cwd: diffRepoPath,
  });
  const isClean = status.includes("nothing to commit");
  if (isClean) {
    logger.info(
      "此baseline已经生成过了, 而且所有的产物hash跟之前完全一样, 所以diff仓库无需提交",
    );
    return;
  }
  await execShellCommand(`git add .`, { cwd: diffRepoPath });
  await execShellCommand(
    `git commit -m "Codepush hash update: ${app}-${version}-${environment}-${platform} ${timestamp} ${process.env.BUILD_USER || ""}"`,
    { cwd: diffRepoPath },
  );
  await execShellCommand(`git pull --rebase`, { cwd: diffRepoPath });
  await execShellCommand(`git push`, { cwd: diffRepoPath });
}

interface BaseRepoManageConfig {
  cwd?: string;
  project: string;
  version: string;
  platform: Platform;
  buildEnv: BuildEnv;
  buildType?: BuildType;
}

// 管理基线文件结构
export function baseRepoManage({
  cwd = process.cwd(),
  project,
  version,
  platform,
  buildEnv,
  buildType,
}: BaseRepoManageConfig) {
  // 基线仓库路径
  const base = path.join(cwd, name, project, version);
  const environment = convertBaseLineEnv(platform, buildEnv);
  const manage = {
    base,
    pkg: {
      getFileName() {
        if (!buildType) throw new Error("buildType 不能为空");
        return `${environment}_${buildType}_${platform}_meta.json`;
      },
      get() {
        const p1 = path.join(base, manage.pkg.getFileName());
        if (codePushContext.verbose) {
          logger.debug(`获取到的 meta.json 文件路径是: ${p1}`);
        }
        return p1;
      },
    },
    lock: {
      getFileName() {
        return `${platform}.common.yarn.lock`;
      },
      get() {
        const p1 = path.join(base, manage.lock.getFileName());
        if (codePushContext.verbose) {
          logger.debug(`获取到的 yarn.lock 文件路径是: ${p1}`);
        }
        return p1;
      },
    },
    // svg文件
    raw: {
      getFileName() {
        return `${environment}-${platform}-raw-baseline.txt`;
      },
      get() {
        const p1 = path.join(base, manage.raw.getFileName());
        logger.debug(`获取到的 raw 文件路径是: ${p1}`);
        return p1;
      },
    },
  };
  return manage;
}
