import axios from "axios";

import logger from "./logger";
import { execShellCommand } from "../build/utils/shell";

/**
 * Get CodePush authentication token
 * Executes 'code-push token' command to retrieve the current authentication token
 * 
 * @returns Promise resolving to the authentication token string
 */
async function getCodePushToken(): Promise<string> {
  const token = await execShellCommand("code-push token", {
    cwd: process.cwd(),
    log: false,
  });
  return token.trim();
}

/**
 * Get CodePush API URL from whoami command
 * Parses the output of 'code-push whoami' to extract the API base URL
 * 
 * @returns Promise resolving to the API base URL string
 * @throws Error if API URL cannot be parsed from whoami output
 */
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

/**
 * Axios instance for making HTTP requests to CodePush API
 * Configured with interceptors for dynamic authentication and error handling
 */
const request = axios.create();

/**
 * Response interceptor for error handling and logging
 * Logs detailed error information for debugging purposes
 */
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

/**
 * Request interceptor for dynamic configuration
 * Sets base URL and authentication token for each request
 * Dynamically retrieves CodePush API URL and token before making requests
 */
request.interceptors.request.use(
  async (config) => {
    // Dynamically get baseURL
    try {
      const baseURL = await getCodePushApiUrl();
      config.baseURL = baseURL;
    } catch (e) {
      logger.error("获取 code-push API URL 失败", e?.message);
      throw e;
    }
    // Dynamically get token
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
