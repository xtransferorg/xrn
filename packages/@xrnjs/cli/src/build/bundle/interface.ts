import type { InputConfigT } from "metro-config";
import type { Platform } from "../typing";

export interface MetaConfig {
  modules: Record<string, { id: number; version: string; hash: string }>;
  id: number;
  hash: string; // bundle 文件内容的 hash
  useOldApp?: boolean
  version?: '1.0.0'
}

export interface BuildBundleConfig {
  platform: Platform;
  bundleName: string;
  output: string;
  sourcemapOutput?: string;
  basePath?: string;
  rootPath?: string;
  assetsDest?: string;
  metaJson?: MetaConfig;
  metroConfig?: InputConfigT;
  verbose?: '0' | '1';
  dev?: string;
  hermes?: string;
  baseBytecodeFilePath?: string;
}

export interface LocalPackage {
  name: string;
  sideEffects: boolean;
  shouldCheckFileHash: boolean;
}
