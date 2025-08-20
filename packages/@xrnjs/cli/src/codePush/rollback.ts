import { exec } from "child_process";

import { BuildEnv, Platform } from "../build/typing";
import { execShellCommand } from "../build/utils/shell";
import logger from "../utlis/logger";

interface RollbackConfig {
  env: string;
  bundleName: string;
  platform: Platform;
  appVersion: string;
  targetUuid?: string;
  rollbackUuid?: string;
  label?: string;
  previous?: boolean;
}

export async function rollback({
  env,
  bundleName,
  platform,
  appVersion,
  targetUuid,
  rollbackUuid,
  label,
  previous = false,
}: RollbackConfig) {
  let app = `${bundleName}-${platform}`;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
  if (env !== BuildEnv.prod && env !== BuildEnv.preProd) {
    // sitxt1
    app += `-${env}`;
  }

  if (targetUuid && label) {
    throw new Error("targetUuid 和 label 不能同时存在");
  }

  let target = "";
  if (targetUuid) {
    target = `--targetUuid ${targetUuid}`;
    if (rollbackUuid) {
      target += ` --rollbackUuid ${rollbackUuid}`;
    }
  }
  if (label) {
    target = `--targetRelease ${label}`;
  }

  const shell = `code-push rollback ${app} Production --appVersion ${appVersion} ${target} --previous ${previous} -y`;
  return new Promise((resolve, reject) => {
    const codepush = exec(shell, (error, stdout, stderr) => {
      if (error) {
        reject(error.message);
        return;
      }
      logger.debug(stdout);
      logger.debug(stderr);
    });
    codepush.on("exit", (code) => {
      if (code === 0) {
        resolve(null);
      }
    });
  });
}

export function rollbackByUuid(
  targetUuid?: string,
  rollbackUuid?: string,
  previous = false,
) {
  if (!targetUuid || !rollbackUuid) {
    throw new Error("targetUuid or rollbackUuid is required");
  }

  const shell = `code-push batch rollback --targetUuid ${targetUuid} --rollbackUuid ${rollbackUuid} --previous ${previous} -y`;
  return execShellCommand(shell, {
    cwd: process.cwd(),
  });
}

export function rollbackByChannelReleaseId(
  channelReleaseId: string,
  previous = true,
) {
  return execShellCommand(
    `code-push batch rollback --channelReleaseId ${channelReleaseId} --previous ${previous} -y`,
    {
      cwd: process.cwd(),
    },
  );
}
