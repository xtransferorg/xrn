import { execAsync } from "./utils";

export class TerminalManager {
  private windowId: string | null = null;

  // 打开新的终端窗口并执行初始命令
  public async openTerminal(initialCommand: string) {
    const command = `
      osascript -e 'tell application "Terminal"
          activate
          do script "${initialCommand}"
          set win_id to id of front window
          return win_id
      end tell'
    `;

    try {
      const { stdout, stderr } = await execAsync(command);
      if (stderr) {
        console.error(`终端打开时的错误输出: ${stderr}`);
        return;
      }

      this.windowId = stdout.trim();
      console.log(`终端打开的输出: ${stdout}`);
    } catch (error) {
      console.error(`打开终端时发生错误: ${(error as Error).message}`);
    }
  }

  // 在打开的终端窗口中执行命令
  public async executeCommand(command: string): Promise<void> {
    if (!this.windowId) {
      console.error("终端未打开，无法执行命令");
      return;
    }

    const execCommand = `
      osascript -e 'tell application "Terminal"
          do script "${command}" in window id ${this.windowId}
      end tell'
    `;

    try {
      const { stdout, stderr } = await execAsync(execCommand);
      if (stderr) {
        console.error(`命令执行时的错误输出: ${stderr}`);
      }
      console.log(`命令执行的输出:\n${stdout}`);
    } catch (error) {
      console.error(`执行命令时发生错误: ${(error as Error).message}`);
    }
  }

  // 关闭终端窗口
  public async closeTerminal(): Promise<void> {
    if (!this.windowId) {
      console.error("终端未打开，无法关闭");
      return;
    }

    const closeCommand = `
      osascript -e 'tell application "Terminal"
          close window id ${this.windowId}
      end tell'
    `;

    try {
      const { stdout, stderr } = await execAsync(closeCommand);
      if (stderr) {
        console.error(`终端关闭时的错误输出: ${stderr}`);
      }
      console.log(`终端关闭的输出:\n${stdout}`);
    } catch (error) {
      console.error(`关闭终端时发生错误: ${(error as Error).message}`);
    }

    this.windowId = null;
  }
}

