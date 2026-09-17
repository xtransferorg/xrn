import axios from "axios";

import logger from "./logger";
import { execShellCommand } from "../build/utils/shell";

async function getCodePushToken(): Promise<string> {
  const token = await execShellCommand("code-push token", {
    cwd: process.cwd(),
    log: false,
  });
  return token.trim();
}

// 通过 code-push whoami 获取 API URL
async function getCodePushApiUrl(): Promise<string> {
  const whoami = await execShellCommand("code-push whoami", {
    cwd: process.cwd(),
    log: false,
  });
  const match = whoami.match(/-\s*(https?:\/\/[^\s]+)/);
  if (match && match[1]) {
    return match[1].trim();
  }
  throw new Error("无法从 code-push whoami 结果中解析出 API URL");
}

// 创建 axios 实例（不传 baseURL）
const request = axios.create();

// 响应拦截器：保留日志逻辑
request.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.config) {
      logger.error(
        "请求出错:" +
          JSON.stringify(
            {
              url: error.config.url,
              method: error.config.method,
              params: error.config.params,
              data: error.config.data,
            },
            null,
            2,
          ),
      );
    }
    if (error.response) {
      logger.error(
        "响应信息:" +
          JSON.stringify(
            {
              status: error.response.status,
              statusText: error.response.statusText,
              data: error.response.data,
            },
            null,
            2,
          ),
      );
    }
    return Promise.reject(new Error(error.message || "请求失败"));
  },
);

// 请求拦截器：动态设置 baseURL 和 token
request.interceptors.request.use(
  async (config) => {
    // 动态获取 baseURL
    try {
      const baseURL = await getCodePushApiUrl();
      config.baseURL = baseURL;
    } catch (e) {
      logger.error("获取 code-push API URL 失败", e?.message);
      throw e;
    }
    // 动态获取 token
    try {
      const token = await getCodePushToken();
      if (token) {
        if (config.headers && typeof config.headers.set === "function") {
          config.headers.set("Authorization", `Bearer ${token}`);
        } else {
          config.headers = {
            ...(config.headers as any),
            Authorization: `Bearer ${token}`,
          };
        }
      }
    } catch (e) {
      logger.warn("获取 codepush token 失败", e?.message);
    }
    return config;
  },
  (error) => Promise.reject(error),
);

export default request;
