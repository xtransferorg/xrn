import fsExtra from "fs-extra";
import path from "path";
import { BuildEnv, BuildType, Platform } from "../build/typing";
import { moveResToNative } from "../build/utils/file";
import { isProd } from "../build/utils";
import { COMMON_BASE_KEY } from "../codePush/diff";
import { MetaConfig } from "../build/bundle/interface";
import logger from "../utlis/logger";

const MANIFEST_RELATIVE_PATH_BY_PLATFORM: Record<Platform, string> = {
  [Platform.iOS]: "release_ios/assets/manifest.json",
  [Platform.Android]: "android/app/src/main/assets/xrn-manifest.json",
  [Platform.Harmony]: "harmony/entry/src/main/resources/rawfile/xrn-manifest.json",
};

/**
 * DEBUG 且非生产环境时，将 package.json dependencies 与 common bundle meta 写入平台资源目录下的 manifest。
 * @param platform 目标平台
 * @param projectRoot RN 工程根目录（用于读取 package.json）
 * @param metaJson buildCommonBundle 返回的 MetaConfig
 * @param buildType 打包类型
 * @param buildEnv 构建环境
 * @param nativeRoot 原生工程根目录，默认为 projectRoot
 */
export async function writeCommonBundleDebugManifest(
  platform: Platform,
  projectRoot: string,
  metaJson: MetaConfig,
  buildType: BuildType,
  buildEnv: BuildEnv,
  nativeRoot: string
): Promise<void> {
  if (buildType !== BuildType.DEBUG || isProd(buildEnv)) {
    return;
  }
  const manifestBasePath = nativeRoot;
  const dest = path.resolve(manifestBasePath, MANIFEST_RELATIVE_PATH_BY_PLATFORM[platform]);
  const manifestContent = {
    dependencies: JSON.parse(fsExtra.readFileSync(path.join(projectRoot, "package.json"), "utf-8")).dependencies,
    [COMMON_BASE_KEY]: metaJson,
  };
  await fsExtra.ensureDir(path.dirname(dest));
  await fsExtra.writeFile(dest, JSON.stringify(manifestContent), "utf-8");
  logger.info(`Debug manifest 已写入: ${dest}`);
}

export async function copyBuildBundleArtifactsToNativeRoot(
  platform: Platform,
  bundleName: string,
  bundleJsFileName: string,
  bundleMapFileName: string,
  bundleOutputPath: string,
  nativeRoot: string
) {
  if (platform === Platform.iOS) {
    await fsExtra.ensureDir(path.join(nativeRoot, "release_ios"));
    await fsExtra.copy(
      path.join(bundleOutputPath, bundleJsFileName),
      path.join(nativeRoot, "release_ios", bundleJsFileName),
      { overwrite: true }
    );
    await moveResToNative(
      path.join(bundleOutputPath, "assets"),
      path.join(nativeRoot, "release_ios", "assets")
    );
    return;
  }

  if (platform === Platform.Harmony) {
    // 和 BundleGitRepository 保持一致，避免 map 文件进入原生目录
    await fsExtra.remove(path.join(bundleOutputPath, bundleMapFileName));

    // 临时兼容：将 assets/assets/src 提升到 assets/src
    if (
      bundleName === "xt-package-xrn" &&
      fsExtra.existsSync(path.join(bundleOutputPath, "assets", "assets", "src"))
    ) {
      await fsExtra.move(
        path.join(bundleOutputPath, "assets", "assets", "src"),
        path.join(bundleOutputPath, "assets", "src"),
        { overwrite: true }
      );
    }

    await fsExtra.copy(
      bundleOutputPath,
      path.join(nativeRoot, "harmony", "entry", "src", "main", "resources", "rawfile"),
      { overwrite: true }
    );
    return;
  }

  await fsExtra.ensureDir(path.join(nativeRoot, "android", "app", "src", "main", "assets"));
  await fsExtra.copy(
    path.join(bundleOutputPath, bundleJsFileName),
    path.join(
      nativeRoot,
      "android",
      "app",
      "src",
      "main",
      "assets",
      bundleJsFileName
    ),
    { overwrite: true }
  );
  await moveResToNative(
    path.join(bundleOutputPath, "res"),
    path.join(nativeRoot, "android", "app", "src", "main", "res")
  );
}
