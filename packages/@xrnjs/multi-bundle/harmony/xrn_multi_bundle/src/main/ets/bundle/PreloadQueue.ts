import { TAG_PRELOAD } from "./Preloadable";

/**
 * 预加载优先级队列。
 *
 * - common 预备池填充（高优先级）与业务 bundle 预加载（普通优先级）统一入队。
 * - 串行执行：任意时刻只有一个任务在运行。
 * - common 任务优先于 biz 任务出队，确保 biz 预加载能尽量复用 common 预备池。
 * - 入队去重：同一 bundleName 不重复入队；common 任务最多保留 1 个。
 */
export class PreloadQueue {
  private static readonly TAG = 'PreloadQueue'

  /** 高优先级队列：common 预备池填充（最多 1 个） */
  private readonly highPriority: Array<{ kind: 'common' }> = []
  /** 普通队列：业务 bundle 预加载（FIFO） */
  private readonly normal: Array<{ kind: 'biz'; bundleName: string }> = []
  /** 当前是否有任务正在执行 */
  private running: boolean = false

  /**
   * @param executeCommon   填充 common 预备池的异步函数（完成后 resolve）
   * @param executeBiz      预加载单个业务 bundle 的异步函数
   * @param shouldSkipCommon 返回 true 时跳过 common 任务（pool 已有实例或正在填充）
   * @param shouldSkipBiz   返回 true 时跳过该 biz bundle（已有 RNInstance 或已就绪）
   */
  constructor(
    private readonly executeCommon: () => Promise<void>,
    private readonly executeBiz: (bundleName: string) => Promise<void>,
    private readonly shouldSkipCommon: () => boolean,
    private readonly shouldSkipBiz: (bundleName: string) => boolean,
  ) {}

  // ─── 公开入口 ───────────────────────────────────────────────────────

  /** 触发 common 预备池填充。
   *  跳过条件：① CommonPool 已有实例或正在填充；② 已入队 */
  enqueueCommon(): void {
    if (this.shouldSkipCommon()) {
      console.info(`${TAG_PRELOAD}-${PreloadQueue.TAG}.enqueueCommon: skip(pool ready or loading)`)
      return
    }
    if (this.highPriority.length > 0) {
      console.info(`${TAG_PRELOAD}-${PreloadQueue.TAG}.enqueueCommon: skip(already queued)`)
      return
    }
    this.highPriority.push({ kind: 'common' })
    console.info(`${TAG_PRELOAD}-${PreloadQueue.TAG}.enqueueCommon: queued`)
    this.drain()
  }

  /** 触发业务 bundle 预加载。
   *  跳过条件：① RNInstanceManager 已有该 bundle 的 RNInstance（state ≠ UNKNOWN）；② 已入队 */
  enqueueBiz(bundleName: string): void {
    console.log(`${TAG_PRELOAD}-${PreloadQueue.TAG}.enqueueBiz: bundleName=${bundleName}`)
    if (this.shouldSkipBiz(bundleName)) {
      console.info(`${TAG_PRELOAD}-${PreloadQueue.TAG}.enqueueBiz: skip(has instance) ${bundleName}`)
      return
    }
    if (this.normal.some(t => t.bundleName === bundleName)) {
      console.info(`${TAG_PRELOAD}-${PreloadQueue.TAG}.enqueueBiz: skip(already queued) ${bundleName}`)
      return
    }
    this.normal.push({ kind: 'biz', bundleName })
    console.info(`${TAG_PRELOAD}-${PreloadQueue.TAG}.enqueueBiz: queued ${bundleName}, normal.length=${this.normal.length}`)
    this.drain()
  }

  /** 清空待执行的 biz 任务（不影响当前正在执行的任务） */
  clearBiz(): void {
    this.normal.length = 0
    console.info(`${TAG_PRELOAD}-${PreloadQueue.TAG}.clearBiz: biz queue cleared`)
  }

  get isRunning(): boolean {
    return this.running
  }

  get pendingCount(): number {
    return this.highPriority.length + this.normal.length
  }

  // ─── 内部调度 ────────────────────────────────────────────────────────

  private drain(): void {
    if (this.running) {
      console.info(`${TAG_PRELOAD}-${PreloadQueue.TAG}.drain: is running`)
      return // 已有任务在跑，本次入队后自动衔接
    }
    this.running = true
    this.next()
  }

  private next(): void {
    console.info(`${TAG_PRELOAD}-${PreloadQueue.TAG}.next:`)
    // 优先消费 common 任务
    const common = this.highPriority.shift()
    if (common) {
      // 出队时再次检查：排队期间 pool 可能已被其他路径填满
      if (this.shouldSkipCommon()) {
        console.info(`${TAG_PRELOAD}-${PreloadQueue.TAG}.next: skip common(pool ready or loading)`)
        this.next()
        return
      }
      console.info(`${TAG_PRELOAD}-${PreloadQueue.TAG}.next: executing common`)
      this.executeCommon()
        .catch(err => console.error(`${TAG_PRELOAD}-${PreloadQueue.TAG}: common failed=${JSON.stringify(err)}`))
        .finally(() => this.next())
      return
    }

    const biz = this.normal.shift()
    if (!biz) {
      this.running = false
      console.info(`${TAG_PRELOAD}-${PreloadQueue.TAG}: queue drained`)
      return
    }

    // 出队时再次检查：排队期间可能已有 RNInstance（业务侧正常加载）
    if (this.shouldSkipBiz(biz.bundleName)) {
      console.info(`${TAG_PRELOAD}-${PreloadQueue.TAG}.next: skip biz(has instance), bundleName=${biz.bundleName}`)
      this.next()
      return
    }

    console.info(`${TAG_PRELOAD}-${PreloadQueue.TAG}.next: executing biz ${biz.bundleName}, remaining=${this.normal.length}`)
    this.executeBiz(biz.bundleName)
      .catch(err => console.error(`${TAG_PRELOAD}-${PreloadQueue.TAG}: biz ${biz.bundleName} failed=${JSON.stringify(err)}`))
      .finally(() => this.next())
  }
}
