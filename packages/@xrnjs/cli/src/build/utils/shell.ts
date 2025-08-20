import { exec } from "child_process";
import ora from "ora";
import { promisify } from "util";
import logger from "../../utlis/logger";
import { buildJobContext } from "../BuildJobContext";
import * as Sentry from "@sentry/node";

export const execAsync = promisify(exec);

const execShPromise = require("exec-sh").promise;

export const execInherit = (
  command,
  options: { cwd?: string } = {}
): Promise<{ stdout: string; stderr: string }> => {
  logger.debug(`执行命令：${command}`);
  return execShPromise(command, { stdio: "inherit", ...options });
};

export function execShellCommand(
  command: string,
  config?: {
    cwd: string;
    oraName?: string
    env?: NodeJS.ProcessEnv;
    log?: boolean;
  },
  needError: boolean = false
): Promise<string> {
  const defaultPath = process.cwd();
  let execLoad: ora.Ora;
  logger.debug(`执行命令：${command}`);
  const log = config?.log ?? buildJobContext.verbose ?? true;
  if (config?.oraName) {
    execLoad = ora(config.oraName).start();
  }
  return new Promise((resolve, reject) => {
    exec(
      command,
      {
        cwd: config?.cwd || defaultPath,
        maxBuffer: 1024 * 1024 * 1024,
        env: config?.env,
      },
      (error, stdout, stderr) => {
        log && stderr && logger.warn(stderr);
        if (error) {
          execLoad?.fail();
          logger.error(error);
          Sentry.captureException(error);
          reject(needError ? stderr : null);
        } else {
          // log && logger.info(stdout);
          execLoad?.succeed();
          resolve(stdout);
        }
      }
    );
  });
}
