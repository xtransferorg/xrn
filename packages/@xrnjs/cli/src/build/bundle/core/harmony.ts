import fs from "fs";
import fse from "fs-extra";
import Metro from "metro";
import { RunBuildOptions as BuildOptions } from "metro";
import MetroServer from "metro/src/Server";
import pathUtils from "path";
import { getAssetDestRelativePath } from "@react-native-oh/react-native-harmony-cli/dist/assetResolver";
import { ConfigT as MetroConfig } from "metro-config";

type AssetData = Metro.AssetData;
type Bundle = { code: string; map: string };
type Path = string;

export async function buildHarmonyBundle(args: {
  minify: any;
  dev: any;
  sourcemapOutput: any;
  config: any;
  bundleOutput: string;
  assetsDest: string;
  entryFile: string;
}) {
  const buildOptions: BuildOptions = {
    entry: args.entryFile,
    platform: "harmony",
    minify: args.minify !== undefined ? args.minify : !args.dev,
    dev: args.dev,
    sourceMap: args.sourcemapOutput,
    sourceMapUrl: args.sourcemapOutput,
  };
  const bundle = await createBundle(args.config, buildOptions);
  await saveBundle(bundle, args.bundleOutput, args.sourcemapOutput);
  const assets = await retrieveAssetsData(args.config, buildOptions);
  await copyAssets(assets, args.assetsDest);
}

async function createBundle(
  metroConfig: MetroConfig,
  buildOptions: BuildOptions
): Promise<Bundle> {
  // casting needed as Metro.runBuild returns Promise<{code: string, map: string}>
  // despite being typed as Promise<void>
  return (await Metro.runBuild(metroConfig, buildOptions)) as unknown as Bundle;
}

async function saveBundle(
  bundle: Bundle,
  bundleOutput: Path,
  sourceMapOutput: Path | undefined
) {
  await fse.ensureDir(pathUtils.dirname(bundleOutput));
  fs.writeFileSync(bundleOutput, bundle.code);
  console.log(`[CREATED] ${bundleOutput}`);
  if (sourceMapOutput) {
    fs.writeFileSync(sourceMapOutput, bundle.map);
    console.log(`[CREATED] ${sourceMapOutput}`);
  }
}

async function retrieveAssetsData(
  metroConfig: MetroConfig,
  buildOptions: BuildOptions
): Promise<readonly AssetData[]> {
  const metroServer = new MetroServer(metroConfig);
  try {
    return await metroServer.getAssets({
      ...MetroServer.DEFAULT_BUNDLE_OPTIONS,
      ...buildOptions,
      entryFile: buildOptions.entry,
      bundleType: "todo",
    });
  } finally {
    metroServer.end();
  }
}

async function copyAssets(
  assetsData: readonly AssetData[],
  assetsDest: Path
): Promise<void> {
  if (assetsDest == null) {
    console.warn("Assets destination folder is not set, skipping...");
    return;
  }
  await fse.ensureDir(assetsDest);
  const fileDestBySrc: Record<Path, Path> = {};
  for (const asset of assetsData) {
    const idx = getHighestQualityFileIdx(asset);
    fileDestBySrc[asset.files[idx]] = pathUtils.join(
      assetsDest,
      getAssetDestRelativePath(asset)
    );
  }
  return copyFiles(fileDestBySrc);
}

function getHighestQualityFileIdx(assetData: AssetData): number {
  let result = 0;
  let maxScale = -1;
  for (let idx = 0; idx < assetData.scales.length; idx++) {
    const scale = assetData.scales[idx];
    if (scale > maxScale) {
      maxScale = scale;
      result = idx;
    }
  }
  return result;
}

function copyFiles(fileDestBySrc: Record<Path, Path>) {
  const fileSources = Object.keys(fileDestBySrc);
  if (fileSources.length === 0) {
    return Promise.resolve();
  }

  console.info(`Copying ${fileSources.length} asset files`);
  return new Promise<void>((resolve, reject) => {
    const copyNext = (error?: Error) => {
      if (error) {
        reject(error);
        return;
      }
      if (fileSources.length === 0) {
        console.info("Done copying assets");
        resolve();
      } else {
        // fileSources.length === 0 is checked in previous branch, so this is string
        const src = fileSources.shift();
        const dest = fileDestBySrc[src];
        copyFile(src, dest, copyNext);
      }
    };
    copyNext();
  });
}

function copyFile(
  src: string,
  dest: string,
  onFinished: (error: Error) => void
): void {
  const destDir = pathUtils.dirname(dest);
  fs.mkdir(destDir, { recursive: true }, (err?) => {
    if (err) {
      onFinished(err);
      return;
    }
    fs.createReadStream(src)
      .pipe(fs.createWriteStream(dest))
      .on("finish", onFinished);
  });
}
