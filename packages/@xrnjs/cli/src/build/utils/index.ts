import { exec } from "child_process";
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

/**
 * Check if a command-line tool is installed and available
 * Executes the tool with --version flag to verify availability
 * 
 * @param tool - Name of the tool to check
 * @returns Promise resolving to ToolCheckResult
 */
export function checkTool(tool: string): Promise<boolean> {
  return new Promise((resolve) => {
    exec(`${tool} --version`, (error, stdout, stderr) => {
      if (error) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}