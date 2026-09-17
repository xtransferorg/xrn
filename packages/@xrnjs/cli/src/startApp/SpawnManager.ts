import { spawn, ChildProcess } from "child_process";

class SpawnManager {
  public process: ChildProcess | null;
  private name: string;

  constructor(name: string) {
    this.name = name;
    this.process = null;
  }

  start(command: string, args: string[], showLogs: boolean): Promise<void> {
    return new Promise((resolve, reject) => {
      // 使用 spawn 方法启动
      // 标准输入使用pipe，标准输出和错误输出使用继承
      this.process = spawn(command, args, {
        stdio: showLogs ? ["pipe", "inherit", "inherit"] : null,
      });

      // 监听进程错误事件
      this.process.on("error", (err) => {
        console.error(`${err.message}`);
        reject(err);
      });

      // 监听进程退出事件
      this.process.on("close", (code) => {
        if (code === 0) {
          console.log(`"${this.name}" 启动成功`);
          resolve();
        } else {
          console.error(`启动失败，退出码: ${code}`);
          reject(new Error(`启动失败，退出码: ${code}`));
        }
      });

      // 监听进程启动事件
      this.process.on("spawn", () => {
        console.log(`"${this.name}" 正在启动...`);
        resolve();
      });
    });
  }

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
