import inquirer from "inquirer";
import path from "path";

import { SpawnManager } from "./SpawnManager";
import { startAppContext } from "./StartAppContext";
import { execAsync, execWithOra } from "./utils";

/**
 * Android emulator manager for starting and managing Android Virtual Devices (AVDs)
 * Handles emulator lifecycle including listing, selection, startup, and activation
 */
class EmulatorManager {
  private avdName: string;

  rnSpawnManager: SpawnManager;

  constructor(avdName: string) {
    this.rnSpawnManager = new SpawnManager("安卓模拟器 " + avdName);
    this.avdName = avdName;
  }

  /**
   * List all available Android Virtual Devices (AVDs)
   * Executes 'emulator -list-avds' and filters out INFO messages
   * @returns Promise resolving to an array of AVD names
   */
  static async listEmulator(): Promise<string[]> {
    const { stdout } = await execAsync("emulator -list-avds");
    return (
      stdout
        ?.split("\n")
        ?.filter(Boolean)
        ?.filter((it) => !it.includes("INFO")) || []
    );
  }

  /**
   * Create an EmulatorManager instance with user-selected AVD
   * Lists available emulators and prompts user to select one if multiple exist
   * @returns Promise resolving to an EmulatorManager instance
   */
  static async create() {
    const advs = await EmulatorManager.listEmulator();
    if (!advs?.length) {
      throw new Error("没有可用的模拟器");
    }

    let adv = advs[0];
    if (advs.length > 1) {
      const answer = await inquirer.prompt({
        type: "list",
        name: "list",
        message: "选择一个模拟器",
        choices: advs.map((adv) => ({ name: adv, value: adv })),
        default: advs[0],
      });
      adv = answer.list;
    }
    return new EmulatorManager(adv);
  }

  /**
   * Start the Android emulator
   * Launches the emulator process and waits for it to be ready
   */
  async start() {
    await this.rnSpawnManager.start(
      "emulator",
      ["-avd", this.avdName],
      startAppContext.args.verbose,
    );
    await this.waitForEmulator();
    this.rnSpawnManager.process?.stdin?.setDefaultEncoding("utf8");
  }

  /**
   * Wait for the emulator to fully boot and be ready for use
   * Executes a shell script to check emulator readiness
   * @returns Promise that resolves when emulator is ready
   */
  waitForEmulator = async () => {
    return execWithOra(
      "等待模拟器启动",
      `sh ${path.join(__dirname, "../../files/wait-for-emulator.sh")}`,
    );
  };

  /**
   * Activate the emulator window on macOS
   * Uses AppleScript to bring the emulator window to the foreground
   * @returns Promise that resolves when emulator is activated
   */
  activate = async () => {
    await execWithOra(
      `激活模拟器${this.avdName}`,
      `osascript -e 'tell application "${this.avdName}" to activate'`,
    );
  };
}

export { EmulatorManager };
