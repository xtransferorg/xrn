import { performance } from "perf_hooks";
import { TimingTrackerStage } from "./typing";
import logger from "../utlis/logger";

interface TimingRecord {
  start?: number;
  end?: number;
}

class TimingTracker {
  private timings: Map<TimingTrackerStage, Map<string, TimingRecord>> =
    new Map();

  constructor() {
    // 初始化每个阶段为一个 Map，用于支持多个实例
    Object.values(TimingTrackerStage).forEach((stage) =>
      this.timings.set(stage, new Map())
    );
  }

  /**
   * 开始记录某个阶段的时间
   * @param stage 阶段
   * @param instanceName 实例名称
   */
  time(stage: TimingTrackerStage, instanceName = stage.toString()): void {
    // logger.info(`开始记录 ${this.formatStageName(stage, instanceName)} 阶段的时间`);
    const stageTimings = this.timings.get(stage);
    if (!stageTimings) {
      throw new Error(`未知的阶段: ${stage}`);
    }

    if (stageTimings.has(instanceName)) {
      throw new Error(`${stage} 阶段中的实例 ${instanceName} 已经开始记录`);
    }

    const startTime = performance.now();

    stageTimings.set(instanceName, { start: startTime });
  }

  /**
   * 结束记录某个阶段的时间
   * @param stage 阶段
   * @param instanceName 实例名称
   */
  timeEnd(stage: TimingTrackerStage, instanceName = stage.toString()): void {
    const stageTimings = this.timings.get(stage);
    if (!stageTimings) {
      throw new Error(`未知的阶段: ${stage}`);
    }

    const timing = stageTimings.get(instanceName);
    if (!timing || timing.start === undefined) {
      throw new Error(`${stage} 阶段中的实例 ${instanceName} 尚未开始记录`);
    }

    timing.end = performance.now();
    stageTimings.set(instanceName, timing);
    // logger.info(
    //   `⏳ ${this.formatStageName(stage, instanceName)} 执行时间: ${
    //     (timing.end - timing.start) / 1000
    //   } 秒`
    // );
  }

  private formatStageName(stage: TimingTrackerStage, instanceName: string) {
    return stage.toString() === instanceName
      ? stage
      : `${stage}:${instanceName}`;
  }

  /**
   * 打印所有阶段的时间统计
   */
  log() {
    logger.info(this.generateReport());
  }

  /**
   * 生成阶段时间统计的文字报告
   * @returns 统计报告字符串
   */
  private generateReport(): string {
    const lines: string[] = [`阶段执行时间统计:`];
    this.timings.forEach((stageTimings, stage) => {
      const stageDurations = Array.from(stageTimings.values()).map((timing) =>
        timing.end && timing.start ? timing.end - timing.start : 0
      );
      const stageTotalDuration = stageDurations.reduce((a, b) => a + b, 0);
      lines.push(
        `\n${stage}: 阶段耗时 ${(stageTotalDuration / 1000).toFixed(2)} 秒`
      );
      if (stageDurations.length > 1) {
        stageTimings.forEach((timing, instanceName) => {
          const duration =
            timing.end && timing.start
              ? (timing.end - timing.start) / 1000
              : undefined;
          if (duration !== undefined) {
            lines.push(`  实例 ${instanceName}: ${duration.toFixed(2)} 秒`);
          } else {
            lines.push(`  实例 ${instanceName}: 未完成`);
          }
        });
      }
    });
    return lines.join("\n");
  }

  async track(args: {
    stage: TimingTrackerStage;
    instanceName?: string;
    callback: () => Promise<void>;
  }) {
    const { stage, callback, instanceName } = args;
    this.time(stage, instanceName);
    await callback();
    this.timeEnd(stage, instanceName);
  }
}

export const timingTracker = new TimingTracker();
