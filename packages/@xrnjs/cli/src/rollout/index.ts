import { AppRolloutOptions } from "./types";
import { generateCommandString } from "../utlis/generateCommandString";
import { CodePushResp } from "../publish/publishTypes";
import { execShellCommand } from "../build/utils/shell";
import logger from "../utlis/logger";

export const appRollout = async (opt: AppRolloutOptions) => {
  const {
    rollout,
    isBackwardCompatible,
    status,
    whiteList,
    updateType,
    onlyApplyVersion,
    notOnlyApplyVersion,
    versionId
  } = opt;

  const command = generateCommandString("code-push native update-release", {
    versionId,
    rollout,
    isBackwardCompatible,
    status,
    whiteList,
    updateType,
    onlyApplyVersion,
    notOnlyApplyVersion,
  });

  const stdout = await execShellCommand(command);
  console.log("修改发布记录命令响应", stdout);
  const resp: CodePushResp<{
    //
  }> = JSON.parse(stdout);
  if (resp.code !== 0) {
    logger.error("修改发布记录失败", resp);
    process.exit(1);
  }
  logger.info("修改发布记录成功");
};
