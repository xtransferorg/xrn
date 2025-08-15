import type { BuildBundleConfig } from './interface';
import { fork } from 'child_process';
import { omit } from 'lodash';
import path from "path";

/* eslint-disable @typescript-eslint/no-unsafe-return */
export function requireModule<T>(root: string, modulePath: string) {
  return require(path.join(root, "node_modules", modulePath)) as T;
}

export function execBuildCore(
  entry: string,
  config: Omit<BuildBundleConfig, "metroConfig">
) {
  const childProcess = fork(path.resolve(__dirname, entry), [], {
    cwd: config.basePath,
    env: {
      ...process.env,
      ...omit(config, 'metaJson'),
    },
  });

  childProcess.send({type: 'start', payload: config.metaJson});
  
  return new Promise((resolve, reject) => {
    childProcess.on("exit", (code) => {
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`));
      } else {
        resolve(true);
      }
    })
    childProcess.on("error", (err) => {
      reject(err);
    });
  });
}
