#!/usr/bin/env node
import { KeyPressHandler } from "./KeyPressHandler";
import { createAppStarter } from "./appStarter";
import { printHelp, printUsage, keepStatusAtBottom } from "./commandsTable";
import { DevServer, startServer } from "./devServer";
import { DeviceType, XrnStartArgs } from "./types";
import { handlePromiseErrors } from "./utils";

/**
 * Main application runner class that handles the interactive CLI experience
 * for starting React Native apps on different platforms
 */
export class AppRunner {
  private devServer: DevServer | null = null;
  private disablePrintBottom = false;
  private keypressHandler: KeyPressHandler;

  // Key constants for keyboard shortcuts
  private static readonly KEY_CTRL_C = "\u0003";
  private static readonly KEY_CTRL_D = "\u0004";
  private static readonly KEY_SHOW_QR = ["p", "P"];
  private static readonly KEY_ANDROID = ["a", "A"];
  private static readonly KEY_IOS_SIM = ["i", "I"];
  private static readonly KEY_IOS = ["o", "O"];
  private static readonly KEY_HARMONY = ["h", "H"];
  private static readonly KEY_HELP = ["?", "？"];

  constructor(private args: XrnStartArgs) {
    this.keypressHandler = new KeyPressHandler(this.handleKeyPress.bind(this));
  }

  /**
   * Start the application runner with development server and interactive mode
   */
  public async start() {
    this.devServer = await startServer(this.args);
    printUsage(!!this.devServer);
    this.startStatusUpdater();
    this.keypressHandler.startInterceptingKeyStrokes();
  }

  /**
   * Start periodic status updates at the bottom of the terminal
   */
  private startStatusUpdater() {
    setInterval(() => {
      if (!this.disablePrintBottom) {
        keepStatusAtBottom();
      }
    }, 10000);
  }

  /**
   * Handle keyboard input for platform selection and other commands
   * @param key - The pressed key character
   */
  private async handleKeyPress(key: string) {
    switch (key) {
      case AppRunner.KEY_CTRL_C:
      case AppRunner.KEY_CTRL_D:
        await this.devServer?.stop();
        process.exit();
        break;

      case AppRunner.KEY_SHOW_QR[0]:
      case AppRunner.KEY_SHOW_QR[1]:
        this.devServer?.showQRCode();
        break;

      case AppRunner.KEY_ANDROID[0]:
      case AppRunner.KEY_ANDROID[1]:
        await this.runPlatform(DeviceType.ANDROID);
        break;

      case AppRunner.KEY_IOS_SIM[0]:
      case AppRunner.KEY_IOS_SIM[1]:
        await this.runPlatform(DeviceType.IOS_SIMULATOR);
        break;

      case AppRunner.KEY_IOS[0]:
      case AppRunner.KEY_IOS[1]:
        await this.runPlatform(DeviceType.IOS);
        break;

      case AppRunner.KEY_HARMONY[0]:
      case AppRunner.KEY_HARMONY[1]:
        await this.runPlatform(DeviceType.HARMONY);
        break;

      case AppRunner.KEY_HELP[0]:
      case AppRunner.KEY_HELP[1]:
        printUsage(!!this.devServer);
        break;
    }
  }

  /**
   * Run the app on a specific platform
   * @param deviceType - The target platform device type
   */
  private async runPlatform(deviceType: DeviceType) {
    this.disablePrintBottom = true;
    this.keypressHandler.stopInterceptingKeyStrokes();

    await handlePromiseErrors(async () => {
      const starter = createAppStarter(deviceType, this.args, this.devServer);
      await starter.start();
    })();

    printHelp();
    this.keypressHandler.startInterceptingKeyStrokes();
    this.disablePrintBottom = false;
  }
}

/**
 * Main entry point function to run the application
 * @param args - Command line arguments and configuration
 */
export async function runApp(args: XrnStartArgs) {
  const runner = new AppRunner(args);
  await runner.start();
}
