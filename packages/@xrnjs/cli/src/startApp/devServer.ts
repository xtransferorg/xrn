/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import detect from "detect-port";
import inquirer from "inquirer";
import { getLocalIP, killProcessOnPort } from "./utils";
import { TerminalManager } from "./TerminalManager";
import { printQRCode, printUsage } from "./commandsTable";
import { SpawnManager } from "./SpawnManager";
import { checkIfRNProjectRoot } from "./utils/check";
import { XrnStartArgs } from "./types";
import { bundleInfo } from "./config";
import logger from "../utlis/logger";
import { readAppJsonFile } from "../utlis/readAppJsonFile";
import { startBusinessBundle, MetroReporter } from "../build/bundle/startBusinessBundle";
import { startAppContext } from "./StartAppContext";

export class DevServer {
  port: number;
  terminalManager: TerminalManager;
  rnSpawnManager: SpawnManager;
  inNewTerminal: boolean;
  reporter: MetroReporter | null = null;

  constructor({
    port,
    inNewTerminal,
  }: {
    port: number;
    inNewTerminal: boolean;
  }) {
    this.inNewTerminal = inNewTerminal;
    this.terminalManager = new TerminalManager();
    this.rnSpawnManager = new SpawnManager("React Native Server");
    this.port = port;
  }

  async start(args: XrnStartArgs, onReady?: () => void) {
    process.env.XRN_DEBUG_MODE = "true";
    const { appJsonConfig } = startAppContext || {};
    const { name } = appJsonConfig || {};
    logger.info(`启动 ${name} 服务, 端口号: ${this.port}`);
    this.reporter = await startBusinessBundle({
      ...args,
      port: this.port,
      onInitializeDone: (reporter) => {
        this.reporter = reporter;
        this.showQRCode();
        printUsage(true);
        onReady?.();
      },
    });
  }

  reload() {
    if (this.reporter) {
      this.reporter.update({ type: "unstable_server_log", level: "info", data: "Reloading connected app(s)..." });
      this.reporter.broadcast("reload", null);
    }
  }

  openDevMenu() {
    if (this.reporter) {
      this.reporter.update({ type: "unstable_server_log", level: "info", data: "Opening Dev Menu..." });
      this.reporter.broadcast("devMenu", null);
    }
  }

  openDevTools() {
    if (this.reporter) {
      this.reporter.update({ type: "unstable_server_log", level: "info", data: "Opening DevTools..." });
      this.reporter.openDevTools();
    }
  }

  async stop() {
    try {
      if (this.inNewTerminal) {
        await this.terminalManager.closeTerminal();
      } else {
        await this.rnSpawnManager.stop();
      }
    } catch (error) {
      console.error((error as Error).message);
    }
  }

  showQRCode() {
    const { appJsonConfig } = startAppContext || {};
    const { name } = appJsonConfig || {};
    const serverAddress = `xrn://${getLocalIP()}:${this.port}`;
    const json = {
      action: "action_set_bundle_host",
      content: serverAddress,
      bundle_name: name,
    };
    printQRCode(JSON.stringify(json));
    const msg = `本地服务地址: ${serverAddress}`;
    if (this.reporter) {
      this.reporter.update({ type: "unstable_server_log", level: "info", data: msg });
    } else {
      logger.info(msg);
    }
  }
}

// 启动开发服务器
async function startServer(
  args: XrnStartArgs,
  onReady?: () => void
): Promise<DevServer | null> {
  if (!checkIfRNProjectRoot()) {
    console.error("当前目录不是 React Native 项目的根目录，不启用开发服务器");
    return null;
  }

  let shouldStartServer = false;
  let inputPort = args?.port?.toString();

  if (!inputPort) {
    const { name, port } = await readAppJsonFile(process.cwd());
    const bundlePort = port || bundleInfo.find((it) => it.name === name)?.port;
    if (bundlePort) {
      inputPort = bundlePort.toString();
    } else {
      const { input } = await inquirer.prompt({
        type: "input",
        name: "input",
        message: "请输入设备端口号",
        default: "8081",
        validate: (value) => {
          const port = parseInt(value as string);
          if (isNaN(port) || port < 0 || port > 65535) {
            return "请输入有效的端口号（0-65535）";
          }
          return true;
        },
      });
      inputPort = input as string;
    }
  }

  const port = parseInt(inputPort);

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
    inNewTerminal: args.newTab ?? true,
  });

  await devServerManager.start(args, onReady);

  return devServerManager;
}

export { startServer };
