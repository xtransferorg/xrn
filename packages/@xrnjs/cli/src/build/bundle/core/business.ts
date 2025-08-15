import type { MetaConfig } from "../interface";
import { buildBundle } from "./core";
import { Platform } from "../../../build/typing";
import { generateBusiness } from "./config";
import logger from "../../../utlis/logger";

const {
  platform,
  bundleName,
  output,
  basePath,
  assetsDest,
  verbose,
  dev,
  sourcemapOutput,
} = process.env;

process.on(
  "message",
  ({ type, payload }: { type: string; payload: object }) => {
    if (type === "start") {
      const metaJson: MetaConfig = (payload || {}) as MetaConfig;

      verbose === "1" && logger.debug(`metaJson: ${metaJson.id}`);

      const metroConfig = generateBusiness(basePath, metaJson, false, {}, platform as Platform)();

      logger.debug(`开始构建 ${basePath} business bundle.`, {
        platform,
        bundleName,
        output,
        basePath,
        assetsDest,
        dev,
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
      }).then(() => {
        process.exit(0);
      });
    }
  }
);
