/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { exec } from "child_process";
import * as fs from "fs";
import * as path from "path";

/**
 * Result of a tool availability check
 */
export interface ToolCheckResult {
  /** Name of the tool being checked */
  tool: string;
  /** Whether the tool is installed and available */
  installed: boolean;
}

/**
 * Check if a command-line tool is installed and available
 * Executes the tool with --version flag to verify availability
 * 
 * @param tool - Name of the tool to check
 * @returns Promise resolving to ToolCheckResult
 */
export function checkTool(tool: string): Promise<ToolCheckResult> {
  return new Promise((resolve) => {
    exec(`${tool} --version`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error checking ${tool}: ${stderr.trim()}`);
        resolve({ tool, installed: false });
      } else {
        resolve({ tool, installed: true });
      }
    });
  });
}

/**
 * Verify that all required tools are installed
 * Checks multiple tools in parallel and throws an error if any are missing
 * 
 * @param tools - Array of tool names to check
 * @throws Error if any required tools are not installed
 */
export async function assertToolsInstalled(tools: string[]): Promise<void> {
  const results: ToolCheckResult[] = await Promise.all(
    tools.map((tool) => checkTool(tool))
  );
  const notInstalled = results.filter((result) => !result.installed);

  if (notInstalled.length > 0) {
    throw new Error(`${notInstalled.map((it) => it.tool).join(", ")} 未安装，可参考 https://xtransferorg.github.io/xrn/guides/getting-started/basic-configuration/ 文档配置环境`);
  }
}

/**
 * Check if the current directory is a React Native project root
 * Verifies the presence of package.json, node_modules, app.json, and react-native dependency
 * 
 * @param directory - Directory to check (defaults to current working directory)
 * @returns Boolean indicating if directory is a React Native project root
 */
export function checkIfRNProjectRoot(
  directory: string = process.cwd()
): boolean {
  const packageJsonPath = path.join(directory, "package.json");
  const nodeModulesPath = path.join(directory, "node_modules");
  const appJsonPath = path.join(directory, "app.json");

  if (!fs.existsSync(packageJsonPath) || !fs.existsSync(nodeModulesPath) || !appJsonPath) {
    return false;
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

  const dependencies = packageJson.dependencies || {};
  const devDependencies = packageJson.devDependencies || {};

  if (dependencies["react-native"] || devDependencies["react-native"]) {
    return true;
  }

  return false;
}

/**
 * Assert that the current directory is a React Native project root
 * Throws an error if the directory is not a valid React Native project
 * 
 * @throws Error if current directory is not a React Native project root
 */
export function assertCheckIfRNProjectRoot() {
  if (!checkIfRNProjectRoot()) {
    throw new Error("当前目录不是一个 React Native 项目的根目录");
  }
}
