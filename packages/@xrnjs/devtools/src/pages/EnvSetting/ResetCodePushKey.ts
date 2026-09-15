import { Platform } from "react-native";

import RequestManager from "./Network";
import { bundleList } from "../../utils/bundleManager";
import { setItemSync } from "../../utils/storage";
import { nativeToast } from "../../utils/toast";

const platform = Platform.OS;

const _parseEnv = (envName: string): string | null => {
  if (envName.startsWith("api-")) {
    return envName.slice(4); // 去掉 "api-" 前缀
  }
  return envName;
};

const _parseCodePushDevelopmentKey = (data: any): string | undefined => {
  return data?.deployments?.[0]?.key;
};

class ResetCodePushKeyError extends Error {
  constructor(public readonly type: "not-created" | "request-failed") {
    super(`ResetCodePushKeyError:${type}`);
    this.name = "ResetCodePushKeyError";
  }
}

export const ResetCodePushKey = async (envName: string): Promise<void> => {
  setItemSync("spUtils", "DEV_ENV_NAME", envName);

  const bundles = await bundleList();

  const env = _parseEnv(envName);
  const urls = bundles.map((item: any) => {
    const url = ``;
    return url;
  });

  const manager = new RequestManager(1, 5000);
  try {
    const results = await manager.executeRequests(urls);

    for (let index = 0; index < bundles.length; index++) {
      const element = bundles[index];
      const requestRes = results[index];

      // Release模式，校验codepush key
      if (!__DEV__) {
        if (requestRes?.data?.error === "406") {
          nativeToast(`${env}环境的codepush key未创建！`);
          throw new ResetCodePushKeyError("not-created");
        } else if (requestRes?.data?.error) {
          nativeToast(
            `请求${env}环境的codepush key失败，请检查手机是否连接云枢`,
          );
          throw new ResetCodePushKeyError("request-failed");
        }
      }

      const developmentKey =
        _parseCodePushDevelopmentKey(requestRes?.data) || "";
      // console.log(`developmentKey：${element?.bundleName}`, developmentKey);

      setItemSync(
        "dev_support",
        `${element?.bundleName}-codepush-key`,
        developmentKey,
      );
    }
  } catch (error) {
    nativeToast("创建批量请求失败，请重试！");
    throw error;
  }
};
