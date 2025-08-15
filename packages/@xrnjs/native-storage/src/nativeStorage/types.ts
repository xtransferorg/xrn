// type Callback = (error?: Error | null) => void;

// type CallbackWithResult<T> = (
//   error?: Error | null,
//   result?: T | null
// ) => void;


export type NativeStorageHook = {
  /**
   * 异步获取值
   * @param key 存储的key
   * @returns Promise
   */
  getItem: () => Promise<string | null>;

  /**
   * 异步设置值
   * @param key 存储的key
   * @param value 存储的值
   * @returns Promise
   */
  setItem: (value: string) => Promise<boolean>;

  /**
   * 异步清空值
   * @param key 存储的key
   * @returns Promise
   */
  removeItem: () => Promise<boolean>;

  /**
   * 同步获取值
   * @param key 存储的key
   * @returns string | null
   */
  getItemSync: () => string | null;

  /**
   * 同步设置值
   * @param key 存储的key
   * @param value 存储的value
   * @returns boolean
   */
  setItemSync: (value: string) => boolean;

  /**
   * 同步清空值
   * @param key 存储的key
   * @returns boolean
   */
  removeItemSync: () => boolean;
};




export type NativeStorageStatic = {
  /**
   * 异步获取值
   * @param key 存储的key
   * @returns Promise
   */
  getItem: (key: string) => Promise<string | null>;

  /**
   * 异步设置值
   * @param key 存储的key
   * @param value 存储的值
   * @returns Promise
   */
  setItem: (key: string, value: string) => Promise<boolean>;

  /**
   * 异步清空值
   * @param key 存储的key
   * @returns Promise
   */
  removeItem: (key: string) => Promise<boolean>;

  /**
   * 同步获取值
   * @param key 存储的key
   * @returns string | null
   */
  getItemSync: (key: string) => string | null;

  /**
   * 同步设置值
   * @param key 存储的key
   * @param value 存储的value
   * @returns boolean
   */
  setItemSync: (key: string, value: string) => boolean;

  /**
   * 同步清空值
   * @param key 存储的key
   * @returns boolean
   */
  removeItemSync: (key: string) => boolean;
};
