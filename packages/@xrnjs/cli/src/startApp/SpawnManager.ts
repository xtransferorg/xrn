import { spawn, ChildProcess } from "child_process";

import logger from "../utlis/logger";

/**
 * Process spawn manager for handling child process lifecycle
 * Provides a clean interface for starting, monitoring, and stopping child processes
 */
class SpawnManager {
  public process: ChildProcess | null;
  private name: string;

  constructor(name: string) {
    this.name = name;
    this.process = null;
  }

  /**
   * Start a child process with the specified command and arguments
   * Manages process lifecycle events and provides error handling
   * 
   * @param command - The command to execute
   * @param args - Command line arguments
   * @param showLogs - Whether to show process output in the terminal
   * @returns Promise that resolves when the process starts successfully
   */
  start(command: string, args: string[], showLogs: boolean): Promise<void> {
    return new Promise((resolve, reject) => {
      // Use spawn method to start the process
      // Use pipe for stdin, inherit for stdout and stderr
      this.process = spawn(command, args, {
        stdio: showLogs ? ["pipe", "inherit", "inherit"] : null,
      });

      // Listen for process error events
      this.process.on("error", (err) => {
        logger.error(`${err.message}`);
        reject(err);
      });

      // Listen for process exit events
      this.process.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          logger.error(`启动失败，退出码: ${code}`);
          reject(new Error(`启动失败，退出码: ${code}`));
        }
      });

      // Listen for process spawn events
      this.process.on("spawn", () => {
        resolve();
      });
    });
  }

  /**
   * Stop the child process gracefully
   * Sends SIGINT signal and waits for the process to terminate
   * 
   * @returns Promise that resolves when the process has stopped
   */
  stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.process) {
        this.process.on("close", (code) => {
          console.log(`${this.name}" 已停止，退出码: ${code}`);
          resolve();
        });
        this.process.kill("SIGINT");
      } else {
        reject(new Error("未启动"));
      }
    });
  }
}

export { SpawnManager };
