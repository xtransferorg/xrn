import { execInherit } from "../build/utils/shell";
import { BuildEnv } from "../build/typing";
import logger from "./logger";

function mapEnvironment(env: BuildEnv | string): string {
  if (env === "pre-prod" || env === "pre-release") {
    return "pre-release";
  }
  if (env === "prod" || env === "release") {
    return "release";
  }
  if (env === "dev") {
    return "dev";
  }
  return "staging";
}

/**
 * 根据环境执行热更新登录脚本
 * 对应 shell 逻辑：
 *
 * if [[ $Environment == 'pre-prod' ]] || [[ $Environment == 'pre-release' ]];then
 *   sh $WORKSPACE/devops/script/app/codepush_login.sh -e 'pre-release'
 * elif [[ $Environment == 'prod' ]] || [[ $Environment == 'release' ]];then
 *   sh $WORKSPACE/devops/script/app/codepush_login.sh -e 'release'
 * elif [ $Environment == "dev" ]; then
 *   sh $WORKSPACE/devops/script/app/codepush_login.sh -e dev
 * else
 *   sh $WORKSPACE/devops/script/app/codepush_login.sh -e staging
 * fi
 */
export async function codepushLoginByEnv({
  env,
  workSpace,
}: {
  env: BuildEnv | string;
  workSpace?: string;
}) {
  const resolvedWorkspace = workSpace || process.env.WORKSPACE || process.cwd();
  const loginEnv = mapEnvironment(env);
  const scriptPath = `${resolvedWorkspace}/devops/script/app/codepush_login.sh`;

  logger.info(
    `执行 code-push 登录，环境: ${loginEnv}，工作空间: ${resolvedWorkspace}`
  );

  try {
    await execInherit(`code-push logout`, {
      cwd: resolvedWorkspace,
    });
  } catch (error) {
    logger.warn("执行 code-push 登出失败，忽略错误", error?.message || error);
  }

  await execInherit(`sh ${scriptPath} -e '${loginEnv}'`, {
    cwd: resolvedWorkspace,
  });
}

/**
 * 临时切换到指定 code-push 环境执行一段逻辑，执行完成后再切回原始环境。
 *
 * - 如果 targetEnv 与 currentEnv 相同，则不会重复登录，直接执行 fn
 * - 无论 fn 是否抛错，都会尝试切回 currentEnv
 */
export async function runWithCodepushEnv<T>({
  targetEnv,
  currentEnv,
  workSpace,
  fn,
}: {
  targetEnv: BuildEnv | string;
  currentEnv: BuildEnv | string;
  workSpace?: string;
  fn: () => Promise<T>;
}): Promise<T> {
  // 目标环境与当前环境一致，直接执行函数
  if (targetEnv === currentEnv) {
    return fn();
  }

  // 先登录到目标环境
  await codepushLoginByEnv({ env: targetEnv, workSpace });

  try {
    return await fn();
  } finally {
    await codepushLoginByEnv({ env: currentEnv, workSpace });
  }
}

/**
 * 根据 syncTargetEnv 决定是否在其他环境再执行一次 fn，并输出统一的日志。
 *
 * - 仅当 syncTargetEnv 在允许列表中时才会执行
 * - 允许的同步环境：dev / staging / pre-prod
 */
export async function runWithSyncTargetEnv<T>({
  syncTargetEnv,
  currentEnv,
  workSpace,
  logLabel,
  fn,
}: {
  syncTargetEnv?: BuildEnv;
  currentEnv: BuildEnv;
  workSpace?: string;
  /** 日志前缀，比如“同步基线数据”或“发布” */
  logLabel: string;
  fn: () => Promise<T>;
}): Promise<void> {
  const validTargetEnv = [BuildEnv.preProd, BuildEnv.dev, BuildEnv.staging];

  if (!syncTargetEnv) {
    return;
  }

  if (!validTargetEnv.includes(syncTargetEnv)) {
    logger.warn(`${logLabel}同步到 ${syncTargetEnv} 环境不合法，跳过`);
    return;
  }

  logger.info(`开始${logLabel}到 ${syncTargetEnv} 环境`);
  await runWithCodepushEnv({
      targetEnv: syncTargetEnv,
      currentEnv,
      workSpace,
      fn,
  });
  logger.info(`${logLabel}到 ${syncTargetEnv} 环境完成`);
}
