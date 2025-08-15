import { TurboModuleRegistry } from "react-native";
import type { TurboModule } from "react-native/Libraries/TurboModule/RCTExport";

export interface Spec extends TurboModule {
  /**
   * 异步通过key获取value值
   * @param key 存储的key
   */
  getItem(key: string): Promise<string | null>;

  /**
   * 异步通过key存储value值
   * @param key 存储的key
   * @param value 存储的value
   */
  setItem(key: string, value: string): Promise<boolean>;

  /**
   * 异步通过key删除value值
   * @param key 存储的key
   */
  removeItem(key: string): Promise<boolean>;

  /**
   * 同步通过key获取value值
   * @param key 存储的key
   */
  getItemSync(key: string): string | null;

  /**
   * 同步通过key存储value值
   * @param key 存储的key
   * @param value 存储的value
   */
  setItemSync(key: string, value: string): boolean;

  /**
   * 同步通过key删除value值
   * @param key 存储的key
   */
  removeItemSync(key: string): boolean;
}

export default TurboModuleRegistry.get<Spec>("XRNNativeStorageModule") as Spec | null;
