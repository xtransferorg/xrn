import fs from "fs-extra";
import path from "path";
import crypto from "crypto";
import logger from "../../utlis/logger";

/**
 * 计算文件的 MD5 哈希值
 */
function calculateFileHash(filePath: string): string {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash("md5");
  hashSum.update(new Uint8Array(fileBuffer));
  return hashSum.digest("hex");
}

/**
 * 获取目录下所有 .patch 文件的文件名和哈希值
 */
function getDirectoryFilesWithHash(
  dirPath: string
): Map<string, string> | null {
  if (!fs.existsSync(dirPath)) {
    return null;
  }

  const filesMap = new Map<string, string>();
  const items = fs.readdirSync(dirPath);

  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);

    // 只处理 .patch 文件
    if (stat.isFile() && item.endsWith(".patch")) {
      const hash = calculateFileHash(fullPath);
      filesMap.set(item, hash);
    }
  }

  return filesMap;
}

export interface ValidatePatchesOptions {
  nativeRootPath: string;
  bundlePath: string;
  bundleName: string;
}

/**
 * 校验原生项目和 bundle 项目中的 @xrnjs/core/patches 是否一致
 */
export function validateXtRnCorePatches({
  nativeRootPath,
  bundlePath,
  bundleName,
}: ValidatePatchesOptions): boolean {
  const nativePatchesPath = path.join(
    nativeRootPath,
    "node_modules",
    "@xrnjs/core",
    "patches"
  );
  const bundlePatchesPath = path.join(
    bundlePath,
    "node_modules",
    "@xrnjs/core",
    "patches"
  );

  logger.info(`***开始校验 ${bundleName} 的 @xrnjs/core/patches 是否与原生一致***`);
  logger.info(`原生 patches 路径: ${nativePatchesPath}`);
  logger.info(`Bundle patches 路径: ${bundlePatchesPath}`);

  // 检查原生项目的 patches 目录是否存在
  if (!fs.existsSync(nativePatchesPath)) {
    logger.error(`原生项目的 @xrnjs/core/patches 目录不存在: ${nativePatchesPath}`);
    return false;
  }

  // 检查 bundle 项目的 patches 目录是否存在
  if (!fs.existsSync(bundlePatchesPath)) {
    logger.error(`Bundle 项目的 @xrnjs/core/patches 目录不存在: ${bundlePatchesPath}`);
    return false;
  }

  // 获取两个目录下的所有文件及其哈希值
  const nativeFiles = getDirectoryFilesWithHash(nativePatchesPath);
  const bundleFiles = getDirectoryFilesWithHash(bundlePatchesPath);

  if (!nativeFiles || !bundleFiles) {
    logger.error("无法读取 patches 目录");
    return false;
  }

  let hasError = false;

  // 检查 bundle 中是否有原生中不存在的 patch 文件
  for (const [fileName] of bundleFiles) {
    if (!nativeFiles.has(fileName)) {
      logger.error(
        `Bundle 中存在原生项目中不存在的 patch 文件: ${fileName}`
      );
      hasError = true;
    }
  }

  // 检查原生中是否有 bundle 中不存在的 patch 文件
  for (const [fileName] of nativeFiles) {
    if (!bundleFiles.has(fileName)) {
      logger.error(
        `原生项目中存在 Bundle 中不存在的 patch 文件: ${fileName}`
      );
      hasError = true;
    }
  }

  // 检查同名文件的内容是否一致
  for (const [fileName, nativeHash] of nativeFiles) {
    const bundleHash = bundleFiles.get(fileName);
    if (bundleHash && bundleHash !== nativeHash) {
      logger.error(
        `patch 文件内容不一致: ${fileName}\n` +
          `  原生哈希: ${nativeHash}\n` +
          `  Bundle哈希: ${bundleHash}`
      );
      hasError = true;
    }
  }

  if (hasError) {
    logger.error(`***${bundleName} 的 @xrnjs/core/patches 校验失败***`);
    logger.error("请确保 bundle 项目和原生项目使用相同版本的 @xrnjs/core，并且 patches 目录内容完全一致");
    logger.info("\n\n");
    return false;
  }

  logger.info(`***${bundleName} 的 @xrnjs/core/patches 校验成功***`);
  logger.info("\n\n");
  return true;
}

