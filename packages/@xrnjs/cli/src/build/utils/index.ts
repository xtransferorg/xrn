import { BuildEnv, Platform } from "../typing";

export function isProd(buildEnv: BuildEnv | string) {
  return (
    buildEnv === BuildEnv.prod.toString() ||
    buildEnv === BuildEnv.preProd.toString()
  );
}

export function padZero(value: number): string {
  return value.toString().padStart(2, "0");
}

export function convertPlatform(platform: Platform) {
  switch (platform) {
    case Platform.iOS:
      return "iOS";
    case Platform.Android:
      return "Android";
    case Platform.Harmony:
      return "Harmony";
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}
