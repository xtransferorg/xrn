import { ApiBaseLineManager } from "./ApiBaseLineManager";
import { BaseLineManager, BaseLineConfig } from "./BaseLineManager";
import { GitBaseLineManager } from "./GitBaseLineManager";

const BASELINE_MODE = process.env.BASELINE_MODE || "api";

export function createBaseLineManager(config: BaseLineConfig): BaseLineManager {
  if (BASELINE_MODE === "api") {
    return new ApiBaseLineManager(config);
  } else {
    return new GitBaseLineManager(config);
  }
}

// 默认实例，用于向后兼容
let defaultBaseLineManager: BaseLineManager | null = null;

export function getDefaultBaseLineManager(
  config?: BaseLineConfig,
): BaseLineManager {
  if (!defaultBaseLineManager && config) {
    defaultBaseLineManager = createBaseLineManager(config);
  }
  if (!defaultBaseLineManager) {
    throw new Error(
      "BaseLineManager not initialized. Please call getDefaultBaseLineManager with config first.",
    );
  }
  return defaultBaseLineManager;
}

export default getDefaultBaseLineManager;
