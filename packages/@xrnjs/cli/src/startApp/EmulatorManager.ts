/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import path from "path";
import { SpawnManager } from "./SpawnManager";
import { execAsync, execWithOra } from "./utils";
import inquirer from "inquirer";
import { startAppContext } from "./StartAppContext";

class EmulatorManager {
  private avdName: string;

  rnSpawnManager: SpawnManager;

  constructor(avdName: string) {
    this.rnSpawnManager = new SpawnManager("安卓模拟器 " + avdName);
    this.avdName = avdName;
  }

  static async listEmulator(): Promise<string[]> {
    const { stdout } = await execAsync("emulator -list-avds");
    return (
      stdout
        ?.split("\n")
        ?.filter(Boolean)
        ?.filter((it) => !it.includes("INFO")) || []
    );
  }

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

  async start() {
    await this.rnSpawnManager.start(
      "emulator",
      ["-avd", this.avdName],
      startAppContext.args.verbose
    );
    await this.waitForEmulator();
    this.rnSpawnManager.process?.stdin?.setDefaultEncoding("utf8");
  }

  waitForEmulator = async () => {
    return execWithOra(
      "等待模拟器启动",
      `sh ${path.join(__dirname, "../../files/wait-for-emulator.sh")}`
    );
  };

  activate = async () => {
    await execWithOra(
      `激活模拟器${this.avdName}`,
      `osascript -e 'tell application "${this.avdName}" to activate'`
    );
  };
}

export { EmulatorManager };
