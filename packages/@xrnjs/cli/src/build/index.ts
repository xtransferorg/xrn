#!/usr/bin/env node

import { Platform, BuildType } from "./typing";
import { buildJobContext } from "./BuildJobContext";
import logger from "../utlis/logger";
import { prepareBundle } from "./bundle/prepareBundle";
import { execShellCommand } from "./utils/shell";
import { publishFirstCodePush } from "../codePush/publishFirst";
import { AndroidBuilder } from "./builders/AndroidBuilder";
import { IOSBuilder } from "./builders/IOSBuilder";
import { HarmonyBuilder } from "./builders/HarmonyBuilder";
import { BaseBuilder } from "./builders/BaseBuilder";
import { DEFAULT_META_CONFIG } from "./constants/meta";

/**
 * Main build function for creating app packages
 * Orchestrates the complete build process including bundle preparation, 
 * platform-specific building, and optional CodePush publishing
 * 
 * @returns Promise resolving to build results
 * @throws Error and exits process if build fails
 */
export async function build() {
  try {
    const { rootPath, buildType, shouldFirstCodePush, skipBundle } =
      buildJobContext;

    // Prepare bundle
    let meta = DEFAULT_META_CONFIG;
    if (!skipBundle) {
      const { meta: m } = await prepareBundle();
      meta = m;
    }
    buildJobContext.meta = meta;

    // Publish first CodePush if needed for release builds
    if (buildType === BuildType.RELEASE && shouldFirstCodePush) {
      await publishFirstCodePush();
    }

    // Create platform-specific builder
    let builder: BaseBuilder;
    switch (buildJobContext.platform) {
      case Platform.Android:
        builder = new AndroidBuilder(buildJobContext, meta);
        break;
      case Platform.iOS:
        builder = new IOSBuilder(buildJobContext, meta);
        break;
      case Platform.Harmony:
        builder = new HarmonyBuilder(buildJobContext, meta);
        break;
      default:
        throw new Error("不支持的平台类型");
    }

    const buildResults = await builder.run();

    return buildResults;
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
