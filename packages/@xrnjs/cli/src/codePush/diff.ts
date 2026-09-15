import type { MetaConfig } from "../build/bundle/interface";
import { execShellCommand } from "../build/utils/shell";
import { BuildEnv, JobParams, Platform } from "../build/typing";
import fs from "fs-extra";
import logger from "../utlis/logger";
import path from "path";
import { getBundleMapName, getBundleName } from "../build/bundle/utils";
import { PackageJson } from "../build/utils/package";
import { getBundleBaseLines } from "../build/utils/file";
import { buildJobContext } from "../build/BuildJobContext";
import { getSignatureSchema } from "../build/utils/generateSignatures";
import { BaseLineFileType, BaselineManager } from "../build/BaselineManager";
import { zipDirectory } from "../utlis/archiveZip";

export const COMMON_BASE_KEY = "commonBaseLine";

export function convertBaseLineEnv(buildEnv: BuildEnv) {
  return buildEnv == BuildEnv.preProd || buildEnv == BuildEnv.prod
    ? BuildEnv.prod
    : BuildEnv.dev;
}

const bundleResources = new Set<string>();

const collectBundleResource = (baselineFilePath: string) => {
  // 检查文件是否存在
  if (!fs.existsSync(baselineFilePath)) {
    logger.warn(`Bundle hash file does not exist: ${baselineFilePath}`);
    return;
  }

  try {
    // 读取文件内容
    const fileContent = fs.readFileSync(baselineFilePath, "utf-8");
    // 按行分割并添加到 bundleResources 中
    const lines = fileContent.split("\n");
    lines.forEach((line) => {
      if (line.trim()) {
        bundleResources.add(line);
      }
    });
    logger.info(
      `已从 ${baselineFilePath} 收集了 ${
        lines.filter((line) => line.trim()).length
      } 个资源到 bundleResources`
    );
  } catch (error) {
    logger.error(`读取 bundleHashFile 失败: ${baselineFilePath}`, error);
  }
};

export async function generateBundleResourceBaseLine(
  bundleName: string,
  bundleOutputPath: string,
  baselineManager: BaselineManager
) {
  const script_root = path.resolve(__dirname, "../../");
  const { filePath: bundleHashFile, bundleDir } =
    baselineManager.getBundleBaselineInfo(
      bundleName,
      BaseLineFileType.BUNDLE_RESOURCE
    );
  logger.info(`bundleHashFile 路径是: ${bundleHashFile}`);
  // 获取资源集合目录
  process.env.code_push_dir = bundleOutputPath;
  process.env.bundleHashFile = bundleHashFile;

  // 不存在该basePath目录, 就创建一个这样的basePath目录
  if (!fs.existsSync(bundleDir)) {
    fs.mkdirSync(bundleDir, { recursive: true });
  }

  await execShellCommand(`rm -rf ${bundleHashFile}`);
  const out = await execShellCommand(
    `source ${script_root}/files/codepush_diff.sh && createBundleHash $code_push_dir ""`,
    { cwd: `${script_root}/files` }
  );

  logger.debug(out);

  await baselineManager.moveFileToTempDir(
    BaseLineFileType.BUNDLE_RESOURCE,
    bundleHashFile,
    bundleName,
    {
      autoGenerateHash: true,
      dirName: bundleName,
    }
  );
}

export async function generateBundleResources() {
  const { baselineManager, subBundle, appName } = buildJobContext;
  subBundle.forEach((item) => {
    const { filePath: bundleResourceBaselinePath } =
      baselineManager.getBundleBaselineInfo(
        item.name,
        BaseLineFileType.BUNDLE_RESOURCE
      );
    collectBundleResource(bundleResourceBaselinePath);
  });
  const { filePath: bundleResourceBaselinePath } =
    baselineManager.getBundleBaselineInfo(
      "xt-app-common",
      BaseLineFileType.BUNDLE_RESOURCE
    );
  collectBundleResource(bundleResourceBaselinePath);

  const resources = baselineManager.baseRepoManage().resources;
  let baseLineFileContent = "";

  for (const line of bundleResources) {
    baseLineFileContent += line + "\n";
  }

  await baselineManager.writeFileToTempDir(
    BaseLineFileType.BUNDLE_RESOURCES,
    resources.getFileName(),
    baseLineFileContent,
    appName
  );
}

export async function generateNativeBaseLine(packagePath: string, meta: MetaConfig) {
  logger.info(`生成基线, 原生项目路径是: ${packagePath}`);
  // 获取iOS/Android 项目的 package.json 存入基线
  const nativePackageJson = `${packagePath}/package.json`;
  if (!fs.existsSync(nativePackageJson)) {
    throw new Error("生成基线, 但是原生项目不存在package.json文件");
  }
  const pkgNative = require(nativePackageJson) as PackageJson;
  const { baselineManager } = buildJobContext;
  const { pkg } = baselineManager.baseRepoManage();
  // 生成基线的 package.json 文件
  const baseLineFileContent = JSON.stringify(
    {
      dependencies: pkgNative.dependencies,
      nativeDeps: buildJobContext.nativeDeps,
      reactNativeConfigDeps: buildJobContext.reactNativeConfigDeps,
      [COMMON_BASE_KEY]: meta,
    },
    null,
    2
  );
  await baselineManager.writeFileToTempDir(
    BaseLineFileType.META,
    pkg.getFileName(),
    baseLineFileContent,
    buildJobContext.appName
  );
}

export async function generateSvgBaseLine(
  packagePath: string,
  jobParams: JobParams
) {
  const svgMap = new Map<string, string>();
  const { baselineManager, appName } = buildJobContext;
  const { base, raw } = baselineManager.baseRepoManage();
  const environment = convertBaseLineEnv(jobParams.buildEnv);
  const platform = jobParams.platform;
  // 扫描所有bundle的基线文件
  const baseLineFiles: string[] = await getBundleBaseLines(
    base,
    environment,
    platform
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
      ([filePathPart, md5Part]) => ` ${filePathPart} ${md5Part}`
    );
    const svgBaselineFileContent = deduplicatedSvgLines.join("\n");
    await baselineManager.writeFileToTempDir(
      BaseLineFileType.RAW,
      raw.getFileName(),
      svgBaselineFileContent,
      appName
    );
    logger.info(`去重后的 SVG 行已合并到目标文件: ${raw.get()}`);
  } catch (error) {
    logger.error(`写入文件错误 ${raw.get()}`);
  }
}

export async function generateSignatureBaseLine(
  packagePath: string,
  jobParams: JobParams
) {
  const { baselineManager, appName } = buildJobContext;
  const { signature } = baselineManager.baseRepoManage();
  const signatureSchema = await getSignatureSchema(jobParams.platform);
  // fs.writeFileSync(signature.get(), JSON.stringify(signatureSchema, null, 2), 'utf-8')
  await baselineManager.writeFileToTempDir(
    BaseLineFileType.NATIVE_SIGNATURE,
    signature.getFileName(),
    JSON.stringify(signatureSchema, null, 2),
    appName
  );
}

export async function moveCommonBundleToBaseLine(packagePath: string) {
  const commonBundlePath = path.resolve(packagePath, "xt-app-common");
  const { baselineManager, appName, platform, meta, hermes } = buildJobContext;

  // if (buildEnv !== BuildEnv.prod || buildType === BuildType.DEBUG) {
  //   // debug 包不上传 common bundle
  //   // 非生产环境不上传 common bundle
  //   return;
  // }
  await baselineManager.moveFileToTempDir(
    BaseLineFileType.COMMON,
    path.resolve(
      commonBundlePath,
      `release_${platform}`,
      getBundleName(platform)
    ),
    appName,
    {
      hash: hermes ? meta.hash : `jsbundle-${meta.hash}`
    }
  );
  await baselineManager.moveFileToTempDir(
    BaseLineFileType.COMMON_MAP,
    path.resolve(
      commonBundlePath,
      `release_${platform}`,
      getBundleMapName(platform)
    ),
    appName
  );

  // 打包 common bundle 产物为 bundle_product.zip，并写入基线
  const commonBundleOutputDir = path.resolve(
    commonBundlePath,
    `release_${platform}`
  );

  if (!fs.existsSync(commonBundleOutputDir)) {
    logger.warn(
      `[moveCommonBundleToBaseLine] common bundle 输出目录不存在，跳过打包: ${commonBundleOutputDir}`
    );
    return;
  }

  const tempZipPath = path.resolve(commonBundlePath, "bundle_product.zip");

  await zipDirectory(commonBundleOutputDir, tempZipPath);
  await baselineManager.moveFileToTempDir(
    BaseLineFileType.BUNDLE_BUILD_PRODUCT,
    tempZipPath,
    appName,
    {
      autoGenerateHash: false,
      dirName: "xt-app-common",
      hash: hermes ? meta.hash : `jsbundle-${meta.hash}`,
    }
  );
}

export async function diffBundleHash(
  packagePath: string,
  bundleName: string,
  jobParams: { platform: Platform; version: string; env: BuildEnv },
  baselineManager: BaselineManager,
  resourceBaselineInfoPath: string,
  harmonyAssets?: string
) {
  const script_root = path.resolve(__dirname, "../../");

  const environment = convertBaseLineEnv(jobParams.env);
  const platform = jobParams.platform;
  const baselineDir = baselineManager.getBaselineDir();
  const basePath = path.join(baselineDir, `${bundleName}`);
  // const bundleHashFile = `${basePath}/${environment}-${platform}-baseline.txt`;
  const bundleHashFile = resourceBaselineInfoPath;
  const currentHashFile = `${basePath}/${environment}-${platform}-current.txt`;
  logger.info(`bundleHashFile 路径是: ${bundleHashFile}`);
  logger.info(`currentHashFile 路径是: ${currentHashFile}`);
  // 获取资源集合目录
  process.env.code_push_dir = `${packagePath}/release_${jobParams.platform}`;
  process.env.bundleHashFile = bundleHashFile;
  process.env.currentHashFile = currentHashFile;
  process.env.harmonyAssets = "";

  if (jobParams.platform === Platform.Harmony && harmonyAssets) {
    process.env.harmonyAssets = harmonyAssets;
  }

  if (!fs.existsSync(bundleHashFile)) {
    throw new Error(
      `[ERROR] Bundle hash baseline file: ${bundleHashFile} does not exist. Please check.`
    );
  }
  logger.info(`Bundle hash file is ${bundleHashFile}`);
  logger.info(`Building bundle output to ${process.env.code_push_dir}`);
  // 清空currentHashFile，不存在则创建一个空文件currentHashFile。 因此每次code push 发更新包，都需要重新生成当次的 currentHashFile
  // currentHashFile 的意义仅仅在于当次codepush diff比对 【其实完全可以当次比对完成之后，直接remove掉，暂时先留这儿吧】
  fs.ensureFileSync(currentHashFile);
  fs.writeFileSync(currentHashFile, "", "utf-8");

  // 对图片进行比对
  await execShellCommand(
    `source ${script_root}/files/codepush_diff.sh && diffBundleHash $code_push_dir ""`,
    { cwd: `${script_root}/files` }
  );
  // 对svg进行比对 bundleHashFile替换为全局的svg基线比对
  const svgBaseLineFile = `${baselineDir}/${environment}-${platform}-raw-baseline.txt`;
  const currentSvgHashFile = `${basePath}/${environment}-${platform}-current-svg.txt`;
  process.env.bundleHashFile = svgBaseLineFile;
  process.env.currentHashFile = currentSvgHashFile;
  fs.ensureFileSync(currentSvgHashFile);
  fs.writeFileSync(currentSvgHashFile, "", "utf-8");
  await execShellCommand(
    `source ${script_root}/files/codepush_diff.sh && diffBundleHash $code_push_dir ""`,
    { cwd: `${script_root}/files` }
  );
}
