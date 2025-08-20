import type { InputConfigT } from "metro-config";
import { buildBundle } from "./core";
import { Platform } from "../../../build/typing";
import { generateCommon } from "./config";
import logger from "../../../utlis/logger";

const { platform, bundleName, output, basePath, dev, assetsDest } = process.env;

const metroConfig: InputConfigT = generateCommon(
  basePath,
  platform as Platform
)();

logger.debug(`开始构建 ${basePath} common bundle.`, {
  platform,
  bundleName,
  output,
  basePath,
  dev,
  assetsDest,
});
// eslint-disable-next-line @typescript-eslint/no-floating-promises
buildBundle({
  platform: platform as Platform,
  bundleName,
  output,
  metroConfig,
  basePath,
  dev,
  assetsDest,
});
