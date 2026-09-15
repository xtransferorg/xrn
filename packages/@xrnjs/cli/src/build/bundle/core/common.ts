import type { InputConfigT } from "metro-config";
import { buildBundle } from "./core";
import { Platform } from "../../../build/typing";
import { generateCommonBundleConfig } from "./config";
import logger from "../../../utlis/logger";

const { platform, bundleName, output, basePath, dev, hermes, assetsDest, rootPath = basePath } = process.env;

const metroConfig: InputConfigT = generateCommonBundleConfig(
  // basePath,
  rootPath,
  platform as Platform
)();

logger.info(`开始构建 ${basePath} common bundle.`, {
  platform,
  bundleName,
  output,
  basePath,
  dev,
  hermes,
  assetsDest,
});
// eslint-disable-next-line @typescript-eslint/no-floating-promises
buildBundle({
  platform: platform as Platform,
  bundleName,
  output,
  metroConfig,
  basePath,
  rootPath,
  dev,
  hermes,
  assetsDest,
});
