/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { exec } from "child_process";
import * as fs from "fs";
import * as path from "path";

export interface ToolCheckResult {
  tool: string;
  installed: boolean;
}

/** 校验命令是否存在 */
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

/** 批量校验工具是否安装 */
export async function assertToolsInstalled(tools: string[]): Promise<void> {
  const results: ToolCheckResult[] = await Promise.all(
    tools.map((tool) => checkTool(tool))
  );
  const notInstalled = results.filter((result) => !result.installed);

  if (notInstalled.length > 0) {
    throw new Error(`${notInstalled.map((it) => it.tool).join(", ")} 未安装，可参考 https://xtransferorg.github.io/guides/getting-started/basic-configuration/ 文档配置环境`);
  }
}

/** 校验当前目录是否为一个 React Native 项目的根目录 */
export function checkIfRNProjectRoot(
  directory: string = process.cwd()
): boolean {
  const packageJsonPath = path.join(directory, "package.json");
  const nodeModulesPath = path.join(directory, "node_modules");
  const appJsonPath = path.join(directory, "app.json");

  if (!fs.existsSync(packageJsonPath) || !fs.existsSync(nodeModulesPath) || !fs.existsSync(appJsonPath)) {
    return false;
  }

  return true;
}

export function assertCheckIfRNProjectRoot() {
  if (!checkIfRNProjectRoot()) {
    throw new Error("当前目录不是一个 React Native 项目的根目录");
  }
}
