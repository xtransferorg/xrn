import type { BuildBundleConfig } from "./interface";
import { fork } from "child_process";
import { omit } from "lodash";
import path from "path";
import logger from "../../utlis/logger";
import fs from "fs";

/* eslint-disable @typescript-eslint/no-unsafe-return */
export function requireModule<T>(root: string, modulePath: string) {
  return require(path.join(root, "node_modules", modulePath)) as T;
}

/**
 * 动态解析文件路径，优先查找 .js 文件，如果不存在则查找 .ts 文件
 */
function resolveEntryFile(basePath: string, entry: string): string {
  const entryWithoutExt = entry.replace(/\.(js|ts)$/, "");
  const jsPath = path.resolve(basePath, `${entryWithoutExt}.js`);
  const tsPath = path.resolve(basePath, `${entryWithoutExt}.ts`);

  // 优先使用编译后的 .js 文件
  if (fs.existsSync(jsPath)) {
    return jsPath;
  }

  // 如果 .js 文件不存在，使用 .ts 文件（开发调试时）
  if (fs.existsSync(tsPath)) {
    return tsPath;
  }

  // 如果都不存在，抛出错误
  throw new Error(
    `Cannot find entry file: ${entry}. Searched paths: ${jsPath}, ${tsPath}`
  );
}

export function execBuildCore(
  entry: string,
  config: Omit<BuildBundleConfig, "metroConfig">
) {
  const resolvedEntryPath = resolveEntryFile(__dirname, entry);

  const childProcess = fork(resolvedEntryPath, [], {
    cwd: config.basePath,
    env: {
      ...process.env,
      ...omit(config, "metaJson"),
    },
  });

  childProcess.send({ type: "start", payload: config.metaJson });

  return new Promise((resolve, reject) => {
    childProcess.on("exit", (code) => {
      logger.info("进程退出: " + code);
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`));
      } else {
        resolve(true);
      }
    });
    childProcess.on("error", (err) => {
      logger.error("进程错误退出: " + JSON.stringify(err));
      reject(err);
    });
  });
}
