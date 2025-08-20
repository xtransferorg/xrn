import AsyncStorage from '@react-native-async-storage/async-storage';

class StorageUtil {

  /**
   * 存储数据
   * @param key 存储的键
   * @param value 存储的值（对象会被转换成 JSON）
   */
  static async setItem<T>(key: string, value: T): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
      console.log(`✅ 存储成功: ${key}`);
    } catch (error) {
      console.error(`❌ 存储失败: ${key}`, error);
    }
  }

  /**
   * 获取数据
   * @param key 存储的键
   * @returns 解析后的对象数据
   */
  static async getItem<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue ? JSON.parse(jsonValue) as T : null;
    } catch (error) {
      console.error(`❌ 读取失败: ${key}`, error);
      return null;
    }
  }

  /**
   * 删除数据
   * @param key 存储的键
   */
  static async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
      console.log(`✅ 删除成功: ${key}`);
    } catch (error) {
      console.error(`❌ 删除失败: ${key}`, error);
    }
  }

}

export default StorageUtil;
