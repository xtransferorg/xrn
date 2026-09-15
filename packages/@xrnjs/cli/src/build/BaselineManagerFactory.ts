import logger from "../utlis/logger";
import { BaselineManager, BaselineManagerConfig } from "./BaselineManager";

/**
 * BaselineManager工厂类，用于管理不同版本的BaselineManager实例
 */
export class BaselineManagerFactory {
  private static instances: Map<string, BaselineManager> = new Map();

  /**
   * 创建或获取BaselineManager实例
   * @param config BaselineManager配置
   * @returns BaselineManager实例
   */
  static createOrGet(config: BaselineManagerConfig): BaselineManager {
    const key = this.generateKey(config);
    
    if (!this.instances.has(key)) {
      logger.info(`[BaselineManagerFactory] 创建新的BaselineManager实例: ${key}`);
      const instance = new BaselineManager(config);
      this.instances.set(key, instance);
    } else {
      logger.info(`[BaselineManagerFactory] 获取已存在的BaselineManager实例: ${key}`);
    }
    
    return this.instances.get(key);
  }

  /**
   * 根据版本号获取BaselineManager实例
   * @param version 版本号
   * @returns BaselineManager实例或undefined
   */
  static getByVersion(version: string): BaselineManager | undefined {
    for (const [key, instance] of this.instances) {
      if (instance.getVersion() === version) {
        logger.info(`[BaselineManagerFactory] 根据版本号找到实例: ${version} (${key})`);
        return instance;
      }
    }
    logger.info(`[BaselineManagerFactory] 未找到版本号为 ${version} 的实例`);
    return undefined;
  }

  /**
   * 获取所有实例
   * @returns 所有BaselineManager实例的Map
   */
  static getAllInstances(): Map<string, BaselineManager> {
    return new Map(this.instances);
  }

  /**
   * 删除指定版本的实例
   * @param version 版本号
   * @returns 是否删除成功
   */
  static removeByVersion(version: string): boolean {
    for (const [key, instance] of this.instances) {
      if (instance.getVersion() === version) {
        this.instances.delete(key);
        logger.info(`[BaselineManagerFactory] 删除版本号为 ${version} 的实例`);
        return true;
      }
    }
    logger.info(`[BaselineManagerFactory] 未找到版本号为 ${version} 的实例`);
    return false;
  }

  /**
   * 清空所有实例
   */
  static clearAll(): void {
    this.instances.clear();
    logger.info(`[BaselineManagerFactory] 清空所有实例`);
  }

  /**
   * 生成实例的唯一键
   * @param config BaselineManager配置
   * @returns 唯一键
   */
  private static generateKey(config: BaselineManagerConfig): string {
    return `${config.platform}_${config.buildEnv}_${config.buildType}_${config.version}`;
  }
}