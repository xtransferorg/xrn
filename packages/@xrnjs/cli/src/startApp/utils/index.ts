import { exec } from "child_process";
import findProcess from "find-process";
import util from "util";
import os from "os";
import ora from "ora";
import logger from "../../utlis/logger";
import { startAppContext } from "../StartAppContext";

// 将exec方法转换为返回Promise的异步函数
export const execAsync = util.promisify(exec);

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

export function getLocalIP() {
  const interfaces = os.networkInterfaces();
  let bestIp = "0.0.0.0";
  let bestScore = -1;

  // 根据网卡名称赋予不同的优先级，分数越高优先级越高
  function getScore(ifaceName: string): number {
    if (ifaceName.startsWith("en") || ifaceName.startsWith("eth") || ifaceName.startsWith("wlan")) {
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
      // 仅考虑IPv4且非内部接口
      if (iface.family === "IPv4" && !iface.internal) {
        // 如果当前接口的优先级更高，则更新返回值
        if (score > bestScore) {
          bestScore = score;
          bestIp = iface.address;
        }
      }
    }
  }
  return bestIp;
}/**
 * 检查并杀掉占用指定端口的进程
 * @param {number} port - 要检查的端口号
 */
export async function killProcessOnPort(port: number): Promise<void> {
  try {
    // 查找占用指定端口的进程
    const list = await findProcess("port", port);

    if (list.length === 0) {
      console.log(`没有进程占用端口 ${port}`);
      return;
    }

    // 获取进程ID
    const pid = list[0].pid;
    console.log(`端口 ${port} 被进程 ${pid} 占用`);

    // 杀掉进程
    process.kill(pid);
    console.log(`进程 ${pid} 已被杀掉`);
  } catch (error) {
    console.error(`无法杀掉占用端口 ${port} 的进程:`, error);
  }
}

export function handlePromiseErrors<T extends (...args: any[]) => Promise<any>>(
  asyncFunc: T,
  {
    name,
  }: {
    name?: string;
  } = {}
): T {
  const fn = async (...args: any[]) => {
    try {
      const result = await asyncFunc(...args);
      return result;
    } catch (error) {
      console.error("An error occurred: ", error);
      // 可以选择抛出错误或返回一个默认值
      return Promise.resolve(null as unknown as T); // 或者处理成你想要的默认值
    }
  };
  return fn as T;
}
