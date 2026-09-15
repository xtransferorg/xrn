/**
 * 校验基准版本号格式：第三位最多两位，例如 3.7.1、3.8.12。
 */
export function validateBaseVersion(version: string): boolean {
  const parts = version.split(".");
  if (parts.length !== 3) {
    return false;
  }

  const [major, minor, patch] = parts;
  return (
    /^\d+$/.test(major) &&
    /^\d+$/.test(minor) &&
    /^\d+$/.test(patch) &&
    patch.length <= 2
  );
}
