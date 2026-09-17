import fs from "fs-extra";
import path from "path";
import logger from "../utlis/logger";
import { XRNConfigType } from "../build/typing";

export type XrnConfig = XRNConfigType 

/**
 * 加载 xrn.config.json 配置文件
 * @param cwd 工作目录
 * @returns XrnConfig 对象或 null
 */
export function loadXrnConfig(cwd: string): XrnConfig | null {
  const xrnConfigPath = path.join(cwd, "xrn.config.json");

  if (!fs.existsSync(xrnConfigPath)) {
    logger.warn(`xrn.config.json 不存在: ${xrnConfigPath}`);
    return null;
  }

  try {
    const xrnConfig: XrnConfig = JSON.parse(
      fs.readFileSync(xrnConfigPath, "utf-8")
    );
    logger.info(`✅ 已加载 xrn.config.json`);
    return xrnConfig;
  } catch (error) {
    logger.error(`❌ 读取 xrn.config.json 失败:`, error);
    throw error;
  }
}
