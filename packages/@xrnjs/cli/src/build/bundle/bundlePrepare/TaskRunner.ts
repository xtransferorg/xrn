export class TaskRunner {
  static async all(tasks: (() => Promise<void>)[]) {
    await Promise.all(tasks.map((task) => task()));
  }
  static async series(tasks: (() => Promise<void>)[]) {
    for (const task of tasks) {
      await task();
    }
  }
} 