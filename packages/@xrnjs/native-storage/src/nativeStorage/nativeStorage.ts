import { requireNativeModule } from "@xrnjs/modules-core";

import { NativeStorageStatic } from "./types";

const RTNNativeStorageModule = requireNativeModule("XRNNativeStorageModule");

const XRNNativeStorage: NativeStorageStatic = {
  /**
   * 异步获取值
   * @param key 存储的key
   * @returns Promise
   */
  getItem: (key) => {
    return new Promise((resolve, reject) => {
      RTNNativeStorageModule?.getItem(key)
        .then((res: string | null) => {
          resolve(res);
        })
        .catch((err: any) => {
          reject(err);
        });
    });
  },

  /**
   * 异步设置值
   * @param key 存储的key
   * @param value 存储的value
   * @returns Promise
   */
  setItem: (key, value) => {
    return new Promise((resolve, reject) => {
      RTNNativeStorageModule?.setItem(key, value)
        .then((res: boolean) => {
          resolve(res);
        })
        .catch((err: any) => {
          reject(err);
        });
    });
  },

  /**
   * 异步清空值
   * @param key 存储的key
   * @returns Promise
   */
  removeItem: (key) => {
    return new Promise((resolve, reject) => {
      RTNNativeStorageModule?.removeItem(key)
        .then((res: boolean) => {
          resolve(res);
        })
        .catch((err: any) => {
          reject(err);
        });
    });
  },

  /**
   * 同步获取值
   * @param key 存储的key
   * @returns 存储的value
   */
  getItemSync: (key) => {
    return RTNNativeStorageModule?.getItemSync(key);
  },

  /**
   * 同步设置值
   * @param key 存储的key
   * @param value 存储的value
   * @returns 是否存储成功
   */
  setItemSync: (key, value) => {
    const success = RTNNativeStorageModule?.setItemSync(key, value);
    return success;
  },

  /**
   * 同步清空值
   * @param key 存储的key
   * @returns 是否清空成功
   */
  removeItemSync: (key) => {
    const success = RTNNativeStorageModule?.removeItemSync(key);
    return success;
  },
};

export { XRNNativeStorage };
