import { AccountSdk } from "@xrnjs/code-push-cli";
import { Platform } from "../build/typing";
import { CodePushDeployment } from "./typing";
import logger from "../utlis/logger";

export async function getCodePushKey({
  bundleName,
  platform,
  env,
}: {
  bundleName: string;
  platform: Platform;
  env: string;
}) {
  const codePushName = `${bundleName}-${platform}-${env}`;
  try {
    const res: CodePushDeployment[] = await AccountSdk.getDeployments(
      codePushName
    );
    const key = res?.find((d) => d.name === "Production")?.key;
    return { codePushName, codePushKey: key };
  } catch (error) {
    logger.warn("获取 CodePush key 失败", {
      codePushName,
      bundleName,
      platform,
      env,
      message: error instanceof Error ? error.message : String(error),
    });
    return { codePushName, codePushKey: undefined };
  }
}
