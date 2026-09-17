import semver from 'semver';

/**
 * 验证版本号格式是否正确
 * @param version 版本号字符串
 * @returns 如果版本号格式正确返回true，否则返回false
 */
export function isValidVersion(version: string): boolean {
  if (!version || typeof version !== 'string') {
    return false;
  }
  
  // 使用semver库验证版本号格式
  return semver.valid(version) !== null;
}

/**
 * 验证版本号格式，如果无效则抛出错误
 * @param version 版本号字符串
 * @param paramName 参数名称，用于错误提示
 * @throws Error 当版本号格式无效时抛出错误
 */
export function validateVersion(version: string, paramName: string = 'version'): void {
  if (!isValidVersion(version)) {
    throw new Error(`${paramName} 必须是有效的版本号格式，例如: 1.0.0, 2.1.3, 3.0.0-beta.1`);
  }
} 