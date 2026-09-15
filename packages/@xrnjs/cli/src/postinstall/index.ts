import { BasePostInstall } from "./BasePostInstall";
import { NativePostInstall } from "./NativePostInstall";
import { AndroidPostInstall } from "./AndroidPostInstall";
import { IOSPostInstall } from "./IOSPostInstall";
import { HarmonyPostInstall } from "./HarmonyPostInstall";
import { BundlePostInstall } from "./BundlePostInstall";
import { loadXrnConfig, XrnConfig } from "./utils";

export type PostInstallPlatform = "android" | "ios" | "harmony" | "bundle";
type NativePlatform = "android" | "ios" | "harmony";

/**
 * 原生平台 PostInstall 工厂函数
 * 根据平台创建对应的 Native PostInstall 实例
 */
export function createNativePostInstall(
  platform: NativePlatform,
  cwd: string,
  xrnConfig: XrnConfig | null
): NativePostInstall {
  switch (platform) {
    case "android":
      return new AndroidPostInstall(cwd, xrnConfig);
    case "ios":
      return new IOSPostInstall(cwd, xrnConfig);
    case "harmony":
      return new HarmonyPostInstall(cwd, xrnConfig);
  }
}

/**
 * PostInstall 工厂函数
 * 根据平台创建对应的 PostInstall 实例
 */
function createPostInstall(
  platform: PostInstallPlatform,
  cwd: string,
  xrnConfig?: XrnConfig | null
): BasePostInstall {
  switch (platform) {
    case "android":
    case "ios":
    case "harmony": {
      // 原生平台需要加载 xrn.config.json（如已传入则复用）
      const resolvedConfig =
        xrnConfig === undefined ? loadXrnConfig(cwd) : xrnConfig;
      return createNativePostInstall(platform, cwd, resolvedConfig);
    }
    case "bundle":
      return new BundlePostInstall(cwd);
  }
}

/**
 * 执行 postinstall
 */
export async function runPostInstall(
  platform: PostInstallPlatform
): Promise<void> {
  const cwd = process.cwd();
  const postInstall = createPostInstall(platform, cwd);
  await postInstall.run();
}

/**
 * 执行多个平台的 postinstall
 * - 仅在首个平台执行 patches 和通用任务
 * - 原生平台复用同一个 xrn.config.json
 */
export async function runPostInstallForPlatforms(
  platforms: PostInstallPlatform[]
): Promise<void> {
  const cwd = process.cwd();
  const uniquePlatforms: PostInstallPlatform[] = [];
  const seen = new Set<PostInstallPlatform>();

  for (const platform of platforms) {
    if (!seen.has(platform)) {
      seen.add(platform);
      uniquePlatforms.push(platform);
    }
  }

  if (uniquePlatforms.length === 0) {
    return;
  }

  const needXrnConfig = uniquePlatforms.some(
    (platform) => platform !== "bundle"
  );
  const xrnConfig = needXrnConfig ? loadXrnConfig(cwd) : null;

  for (let index = 0; index < uniquePlatforms.length; index += 1) {
    const platform = uniquePlatforms[index];
    const postInstall = createPostInstall(platform, cwd, xrnConfig);
    const shouldSkipSharedTasks = index > 0;
    await postInstall.run({
      skipPatches: shouldSkipSharedTasks,
      skipCommonTasks: shouldSkipSharedTasks,
    });
  }
}

// 导出类型和类，方便外部使用
export { BasePostInstall } from "./BasePostInstall";
export { NativePostInstall } from "./NativePostInstall";
export { AndroidPostInstall } from "./AndroidPostInstall";
export { IOSPostInstall } from "./IOSPostInstall";
export { HarmonyPostInstall } from "./HarmonyPostInstall";
export { BundlePostInstall } from "./BundlePostInstall";
export { XrnConfig, loadXrnConfig } from "./utils";
