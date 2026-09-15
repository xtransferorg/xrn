export type AsyncTask = () => Promise<void>;

/**
 * 任务执行模式
 * - parallel: 并行执行所有任务
 * - serial: 串行执行所有任务
 */
export type TaskMode = "parallel" | "serial";

/**
 * 根据模式执行任务数组
 */
export async function runTasks(tasks: AsyncTask[], mode: TaskMode = "serial"): Promise<void> {
  if (mode === "parallel") {
    await Promise.all(tasks.map((task) => task()));
  } else {
    for (const task of tasks) {
      await task();
    }
  }
}

