import type { BuildEnv, Platform } from "../typing";
import { execBuildCore } from "./module";
import { MetaConfig } from "./interface";
import { getBundleName, invalidatePatch } from "./utils";
import path from "path";
import { isProd } from "../utils";
import { StartTemplateManager } from "../utils/StartTemplateManager";

interface BuildBusinessBundleConfig {
  platform: Platform;
  env: BuildEnv
  name: string;
  output: string;
  root: string;
  meta: MetaConfig;
  sourcemapOutput?: string;
  assetsDest?: string;
  verbose?: boolean;
  dev?: boolean;
}

export async function buildBusinessBundle({
  platform,
  name,
  output,
  root,
  assetsDest,
  verbose,
  dev,
  sourcemapOutput,
  meta,
  env
}: BuildBusinessBundleConfig) {

  let ENV_NAME = 'dev';
  if (isProd(env)) {
    ENV_NAME = 'prod';
  }
  process.env.ENV_NAME = ENV_NAME;

  const startTemplateManager = await StartTemplateManager.create(root);
  await startTemplateManager.assertIndexTsModify()

  await invalidatePatch(path.resolve(root, "patches"), meta);
  await execBuildCore("core/business.js", {
    platform: platform,
    bundleName: getBundleName(platform, name),
    output: output,
    basePath: root,
    assetsDest: assetsDest,
    metaJson: meta,
    verbose: verbose ? "1" : "0",
    dev: dev ? "1" : "0",
    sourcemapOutput
  });
}
