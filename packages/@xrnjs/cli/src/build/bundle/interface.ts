import type { InputConfigT } from "metro-config";
import type { Platform } from "../typing";

export interface MetaConfig {
  modules: Record<string, { id: number; version: string }>;
  id: number;
  hash: string; // bundle 文件内容的 hash
  useOldApp?: boolean
}

export interface BuildBundleConfig {
  platform: Platform;
  bundleName: string;
  output: string;
  sourcemapOutput?: string;
  basePath?: string;
  assetsDest?: string;
  metaJson?: MetaConfig;
  metroConfig?: InputConfigT;
  verbose?: '0' | '1';
  dev?: string;
}
