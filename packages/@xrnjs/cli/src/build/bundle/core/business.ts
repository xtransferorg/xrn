import type { MetaConfig } from "../interface";
import { buildBundle } from "./core";
import { Platform } from "../../../build/typing";
import { generateBusinessBundleConfig } from "./config";
import logger from "../../../utlis/logger";

const {
  platform,
  bundleName,
  output,
  basePath,
  assetsDest,
  verbose,
  dev,
  hermes,
  sourcemapOutput,
  baseBytecodeFilePath,
} = process.env;

process.on(
  "message",
  ({ type, payload }: { type: string; payload: object }) => {
    if (type === "start") {
      const metaJson: MetaConfig = (payload || {}) as MetaConfig;

      verbose === "1" && logger.debug(`metaJson: ${metaJson.id}`);

      const metroConfig = generateBusinessBundleConfig(basePath, metaJson, false, {}, platform as Platform)();

      logger.info(`开始构建 ${basePath} business bundle.`, {
        platform,
        bundleName,
        output,
        basePath,
        assetsDest,
        dev,
        hermes,
        sourcemapOutput,
      });
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      buildBundle({
        platform: platform as Platform,
        bundleName,
        output,
        metroConfig,
        basePath,
        assetsDest,
        dev,
        sourcemapOutput,
        hermes,
        baseBytecodeFilePath,
      }).then(() => {
        process.exit(0);
      });
    }
  }
);
