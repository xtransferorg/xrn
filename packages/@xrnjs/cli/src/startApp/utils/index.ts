import { exec } from "child_process";
import findProcess from "find-process";
import ora from "ora";
import os from "os";
import util from "util";

import logger from "../../utlis/logger";
import { startAppContext } from "../StartAppContext";

// Convert exec method to return Promise-based async function
export const execAsync = util.promisify(exec);

/**
 * Execute a command with a loading spinner and error handling
 * Shows a spinner during command execution and handles various error conditions
 * 
 * @param name - Display name for the spinner
 * @param command - Command to execute
 * @returns Promise resolving to boolean indicating success/failure
 */
export const execWithOra = async (name: string, command: string) => {
  const spinner = ora(name).start();
  try {
    const { stdout, stderr } = await execAsync(command);
    if (startAppContext.args.verbose) {
      logger.info(`执行命令: ${command}`);
    }
    if (stderr) {
      if (startAppContext.args.verbose) {
        logger.error(`${stderr}`);
      }
    }
    if (
      stderr.includes("failed to start ability") ||
      stdout.includes("failed to start ability")
    ) {
      spinner.fail();
      logger.error(`执行失败: failed to start ability`);
      return false;
    }
    if (startAppContext.args.verbose) {
      logger.info(`执行成功: ${stdout}`);
    }
    spinner.succeed();
    return true;
  } catch (error) {
    logger.error(`执行出错: ${(error as Error).message}`);
    spinner.fail();
    return false;
  }
};

/**
 * Get the best local IP address for network communication
 * Prioritizes network interfaces based on their names and types
 * Prefers Ethernet/WiFi interfaces over virtual interfaces
 * 
 * @returns The best available local IP address
 */
export function getLocalIP() {
  const interfaces = os.networkInterfaces();
  let bestIp = "0.0.0.0";
  let bestScore = -1;

  // Assign different priorities based on interface names, higher score means higher priority
  function getScore(ifaceName: string): number {
    if (
      ifaceName.startsWith("en") ||
      ifaceName.startsWith("eth") ||
      ifaceName.startsWith("wlan")
    ) {
      return 100;
    } else if (ifaceName.startsWith("ap")) {
      return 90;
    } else if (ifaceName.startsWith("awdl") || ifaceName.startsWith("llw")) {
      return 50;
    } else if (ifaceName.startsWith("utun")) {
      return 10;
    } else if (ifaceName.startsWith("lo")) {
      return 0;
    }
    return 0;
  }

  for (const name of Object.keys(interfaces)) {
    const score = getScore(name);
    for (const iface of interfaces[name] || []) {
      // Only consider IPv4 and non-internal interfaces
      if (iface.family === "IPv4" && !iface.internal) {
        // If current interface has higher priority, update return value
        if (score > bestScore) {
          bestScore = score;
          bestIp = iface.address;
        }
      }
    }
  }
  return bestIp;
}

/**
 * Check and kill processes occupying a specific port
 * Finds processes using the specified port and terminates them
 * 
 * @param port - The port number to check
 */
export async function killProcessOnPort(port: number): Promise<void> {
  try {
    // Find processes occupying the specified port
    const list = await findProcess("port", port);

    if (list.length === 0) {
      logger.info(`没有进程占用端口 ${port}`);
      return;
    }

    // Get process ID
    const pid = list[0].pid;
    logger.info(`端口 ${port} 被进程 ${pid} 占用`);

    // Kill the process
    process.kill(pid);
    logger.info(`进程 ${pid} 已被杀掉`);
  } catch (error) {
    logger.error(`无法杀掉占用端口 ${port} 的进程:`, error);
  }
}

/**
 * Wrap an async function with error handling
 * Catches and logs errors without breaking the application flow
 * 
 * @param asyncFunc - The async function to wrap
 * @returns Wrapped function with error handling
 */
export function handlePromiseErrors<T extends (...args: any[]) => Promise<any>>(
  asyncFunc: T
): T {
  const fn = async (...args: any[]) => {
    try {
      const result = await asyncFunc(...args);
      return result;
    } catch (error) {
      logger.error("An error occurred: ", error);
      // Can choose to throw error or return a default value
      return Promise.resolve(null as unknown as T); // Or handle to your desired default value
    }
  };
  return fn as T;
}
