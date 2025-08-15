import Server from 'metro/src/Server';
const outputBundle = require('metro/src/shared/output/bundle');
import path from 'path';
import { CommandLineArgs } from "@react-native-community/cli-plugin-metro/build/commands/bundle/bundleCommandLineArgs";
import type {Config} from '@react-native-community/cli-types';
import saveAssets from "@react-native-community/cli-plugin-metro/build/commands/bundle/saveAssets";
import {
  default as loadMetroConfig,
  MetroConfig,
} from '@react-native-community/cli-plugin-metro/build/tools/loadMetroConfig';
import {logger} from '@react-native-community/cli-tools';

interface RequestOptions {
  entryFile: string;
  sourceMapUrl: string | undefined;
  dev: boolean;
  minify: boolean;
  platform: string | undefined;
  unstable_transformProfile: string | undefined;
  generateStaticViewConfigs: boolean;
}

export interface AssetData {
  __packager_asset: boolean;
  fileSystemLocation: string;
  hash: string;
  height: number | null;
  httpServerLocation: string;
  name: string;
  scales: number[];
  type: string;
  width: number | null;
  files: string[];
}

async function buildBundle(
  args: CommandLineArgs,
  ctx: Config,
  output: typeof outputBundle = outputBundle,
) {
  const config = await loadMetroConfig(ctx, {
    maxWorkers: args.maxWorkers,
    resetCache: args.resetCache,
    config: args.config,
  });

  return buildBundleWithConfig(args, config, output);
}

/**
 * Create a bundle using a pre-loaded Metro config. The config can be
 * re-used for several bundling calls if multiple platforms are being
 * bundled.
 */
export async function buildBundleWithConfig(
  args: CommandLineArgs,
  config: MetroConfig,
  output: typeof outputBundle = outputBundle,
) {
  process.env.NODE_ENV = args.dev ? 'development' : 'production';

  let sourceMapUrl = args.sourcemapOutput;
  if (sourceMapUrl && !args.sourcemapUseAbsolutePath) {
    sourceMapUrl = path.basename(sourceMapUrl);
  }

  const requestOpts: RequestOptions = {
    entryFile: args.entryFile,
    sourceMapUrl,
    dev: args.dev,
    minify: args.minify !== undefined ? args.minify : !args.dev,
    platform: args.platform,
    unstable_transformProfile: args.unstableTransformProfile,
    generateStaticViewConfigs: args.generateStaticViewConfigs,
  };
  const server = new Server(config);

  try {
    const bundle = await output.build(server, requestOpts);

    await output.save(bundle, args, logger.info);

    // Save the assets of the bundle
    const outputAssets: AssetData[] = await server.getAssets({
      ...Server.DEFAULT_BUNDLE_OPTIONS,
      ...requestOpts,
      bundleType: 'todo',
    });

    // When we're done saving bundle output and the assets, we're done.
    return await saveAssets(
      outputAssets,
      args.platform,
      args.assetsDest,
      args.assetCatalogDest,
    );
  } finally {
    server.end();
  }
}

export default buildBundle;
