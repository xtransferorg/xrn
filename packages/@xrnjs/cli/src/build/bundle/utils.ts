/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import type { MetaConfig } from "./interface";
import { parsePatchFile } from "patch-package/dist/patch/parse";
import { BuildEnv, BuildType, Platform } from "../typing";
import { baseRepoManage, COMMON_BASE_KEY } from "../../codePush/diff";
import path from "path";
import fs from "fs";
import logger from "../../utlis/logger";
import crypto from "crypto";
import { BundleExt, BundleFileName } from "./constant";
import fsPromise from "fs/promises";
import { PackageJson } from "../utils/package";

function parsePathToArray(filePath: string) {
  const parts = filePath.split(path.sep);
  const result = [];
  let currentPath = "";

  for (const part of parts) {
    currentPath = currentPath ? path.join(currentPath, part) : part;
    result.push("/" + currentPath);
  }

  return result;
}

export function findVersion(module: string, basePath: string) {
  const keys: string[] = parsePathToArray(module).reverse() as string[];
  const filepaths: string[] = [];
  for (const key of keys) {
    if (/node_modules$/.test(key)) {
      break;
    } else {
      filepaths.push(key);
    }
  }
  const packagePath = filepaths.reverse().find((key) => {
    const filename = path.join(basePath, key);
    if (isExistDir(filename)) {
      const filepath = path.join(filename, "package.json");
      if (fs.existsSync(filepath)) {
        return true;
      }
    }
    return null;
  });
  return (
    packagePath &&
    (require(path.join(basePath, packagePath, "package.json")) as PackageJson)
      .version
  );
}

export function chdir(dir: string) {
  const cwd = process.cwd();
  logger.info(`set chdir: ${dir}`);
  process.chdir(dir);
  return () => {
    process.chdir(cwd);
    logger.info(`restore chdir: ${cwd}`);
  };
}

export function isExistDir(dir: string) {
  return fs.existsSync(dir) && fs.statSync(dir).isDirectory();
}

export function isExistFile(dir: string) {
  return fs.existsSync(dir);
}

interface PatchNormalized {
  type: string;
  path: string; // "node_modules/react-native/Libraries/Blob/FileReader.js"
  hunks: {
    header: {
      original: {
        start: number;
        length: number;
      };
      patched: {
        start: number;
        length: number;
      };
    };
    parts: {
      type: string; // "context"
      lines: string[];
      noNewlineAtEndOfFile: boolean;
    }[];
    source: string;
  }[];
  beforeHash: string; // "51185fc";
  afterHash: string; // "b1b3b7b";
}

export async function invalidatePatch(root: string, meta: MetaConfig) {
  if (!isExistDir(root)) {
    return;
  }
  const patches = await fsPromise.readdir(root);
  if (patches.length === 0) {
    return;
  }
  return await Promise.all(
    patches.map(async (patch) => {
      const normalized: PatchNormalized[] = (
        parsePatchFile as (a: string) => PatchNormalized[]
      )(await fsPromise.readFile(`${root}/${patch}`, "utf-8"));
      normalized.forEach((n) => {
        if (meta.modules[n.path]) {
          // TODO 在拆包稳定后需要去掉
          logger.warn(
            `${n.path} 模块维护在 common bundle 中，不允许对其进行 patch`
          );
          // throw new Error(
          //   `${n.path} 模块维护在 common bundle 中，不允许对其进行 patch`
          // );
        }
      });
      return normalized;
    })
  );
}

// const initBaseLineRepoFn = (() => {
//   let initialized = false,
//     tmp: string;
//   return async () => {
//     if (initialized) return tmp;
//     try {
//       const npmCache =
//         (await execShellCommand(
//           "npm config get cache",
//           { cwd: null, log: false },
//           true
//         )) || ".xt";
//       tmp = path.resolve(os.homedir(), npmCache.trim());
//       const diffRepoPath = path.resolve(tmp, name);
//       if (isExistDir(diffRepoPath)) {
//         await syncRepo(branch, diffRepoPath);
//       } else {
//         // TODO branch
//         await initBaseLineRepo(tmp, branch);
//       }
//     } catch (e) {
//       throw new Error(e);
//     }
//     initialized = true;
//     return tmp;
//   };
// })();

interface IMetaConfig {
  version: string;
  platform: Platform;
  project?: string;
  buildType?: BuildType;
  buildEnv: BuildEnv;
  temp?: string;
  channel?: string;
}

export async function getBaseJson({
  version,
  platform,
  project = "XTransfer",
  buildType = BuildType.DEBUG,
  buildEnv,
  temp = "",
  channel = "china",
}: IMetaConfig) {
  // const tmp = temp || (await initBaseLineRepoFn());
  return baseRepoManage({
    // cwd: tmp,
    platform,
    project,
    version,
    buildEnv,
    buildType,
  });
}

export async function getMetaJson({
  version,
  platform,
  project = "XTransfer",
  buildType = BuildType.DEBUG,
  buildEnv,
  temp = "",
  channel,
}: IMetaConfig): Promise<MetaConfig> {
  const { pkg } = await getBaseJson({
    version,
    platform,
    project,
    buildType,
    buildEnv,
    temp,
    channel,
  });
  try {
    const meta = (require(pkg.get()) as PackageJson)[COMMON_BASE_KEY];

    return meta as MetaConfig;
  } catch {
    throw new Error(`app: ${version} ${pkg.get()} 文件未找到`);
  }
}

// export async function getDependenciesJson({
//   version,
//   platform,
//   project = "XTransfer",
//   buildType = BuildType.DEBUG,
//   buildEnv,
//   temp = "",
// }: IMetaConfig) {
//   const { pkg } = await getBaseJson({
//     version,
//     platform,
//     project,
//     buildType,
//     buildEnv,
//     temp,
//   });
//   try {
//     const dependencies = require(pkg.get()).dependencies;

//     return dependencies;
//   } catch {
//     throw new Error(`app: ${version} ${pkg.get()} 文件未找到`);
//   }
// }

export function getFileHash(filePath: string, algorithm = "sha256") {
  return new Promise<string>((resolve, reject) => {
    const hash = crypto.createHash(algorithm);
    const stream = fs.createReadStream(filePath);

    stream.on("data", (chunk) => {
      hash.update(chunk as string);
    });

    stream.on("end", () => {
      resolve(hash.digest("hex"));
    });

    stream.on("error", (err) => {
      reject(err);
    });
  });
}

export function getBundleName(platform: string, name = "xt-app-common") {
  return `${BundleFileName[platform]}${name}.${BundleExt[platform]}`;
}

export function getBundleMapName(platform: string, name = "xt-app-common") {
  return `${BundleFileName[platform]}${name}.${BundleExt[platform]}.map`;
}
