import detect from "detect-port";
import inquirer from "inquirer";

import { SpawnManager } from "./SpawnManager";
import { startAppContext } from "./StartAppContext";
import { printQRCode } from "./commandsTable";
import { XrnStartArgs } from "./types";
import { execAsync, getLocalIP, killProcessOnPort } from "./utils";
import { checkIfRNProjectRoot } from "./utils/check";
import { startBusinessBundle } from "../build/bundle/startBusinessBundle";
import logger from "../utlis/logger";
import { readAppJsonFile } from "../utlis/readAppJsonFile";

const delay = (t: number) => new Promise((resolve) => setTimeout(resolve, t));

/**
 * Development server manager for React Native applications
 * Handles server startup, QR code generation, and process management
 */
export class DevServer {
  port: number;
  rnSpawnManager: SpawnManager;

  constructor({ port }: { port: number }) {
    this.rnSpawnManager = new SpawnManager("React Native Server");
    this.port = port;
  }

  /**
   * Start the development server with the given arguments
   * @param args - Server configuration arguments
   */
  async start(args: XrnStartArgs) {
    process.env.XRN_DEBUG_MODE = "true";
    const { appJsonConfig } = startAppContext || {};
    const { name } = appJsonConfig || {};
    logger.info(`启动 ${name} 服务, 端口号: ${this.port}`);
    await startBusinessBundle({
      ...args,
      port: this.port,
    });
  }

  /**
   * Reload the development server
   */
  reload = async () => {
    await execAsync(`curl -X POST http://localhost:${this.port}/reload`);
  };

  /**
   * Stop the development server and cleanup resources
   */
  async stop() {
    try {
      await this.rnSpawnManager.stop();
    } catch (error) {
      logger.error((error as Error).message);
    }
  }

  /**
   * Display QR code for connecting to the development server
   * Generates a QR code with the local server address for easy device connection
   */
  showQRCode() {
    const serverAddress = `xrn://${getLocalIP()}:${this.port}`;
    const json = {
      action: "action_set_bundle_host",
      content: serverAddress,
    };
    printQRCode(JSON.stringify(json));
    logger.info(`本地服务地址: ${serverAddress}`);
  }
}

/**
 * Start the development server with port detection and conflict resolution
 * This function handles the complete server startup process including:
 * - Port availability checking
 * - Port conflict resolution
 * - Server initialization
 * - QR code display
 * 
 * @param args - Server configuration arguments
 * @returns DevServer instance or null if server cannot be started
 */
async function startServer(args: XrnStartArgs): Promise<DevServer | null> {
  if (!checkIfRNProjectRoot()) {
    console.error("当前目录不是 React Native 项目的根目录，不启用开发服务器");
    return null;
  }

  let shouldStartServer = false;
  let inputPort = args?.port?.toString();

  // Determine port number from arguments or configuration
  if (!inputPort) {
    const { port } = await readAppJsonFile(process.cwd());
    const bundlePort = port;
    if (bundlePort) {
      inputPort = bundlePort.toString();
    } else {
      const { input } = await inquirer.prompt({
        type: "input",
        name: "input",
        message: "请输入设备端口号",
        default: "8081",
        validate: (value) => {
          const port = parseInt(value as string, 10);
          if (isNaN(port) || port < 0 || port > 65535) {
            return "请输入有效的端口号（0-65535）";
          }
          return true;
        },
      });
      inputPort = input as string;
    }
  }

  const port = parseInt(inputPort, 10);

  // Check port availability and handle conflicts
  const _port = await detect(port);
  if (_port === port) {
    logger.info(`Port ${port} is available.`);
    shouldStartServer = true;
  } else {
    const { confirm } = await inquirer.prompt({
      type: "confirm",
      name: "confirm",
      message: `端口 ${port} 被占用. 是否杀掉占用进程?`,
    });
    shouldStartServer = confirm;
    if (shouldStartServer) {
      await killProcessOnPort(port);
    }
  }
  
  if (!shouldStartServer) {
    return null;
  }
  
  const devServerManager = new DevServer({
    port,
  });

  await devServerManager.start(args);

  // Wait for server to fully start before showing QR code
  await delay(4000);
  devServerManager.showQRCode();

  return devServerManager;
}

export { startServer };
