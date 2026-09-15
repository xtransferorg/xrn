import { RNInstance } from "@rnoh/react-native-openharmony/src/main/ets/RNOH/RNInstance";
import { TAG_PRELOAD } from "./Preloadable";

/** 创建一个 common-bundle 已加载的 RNInstance */
export type CommonInstanceFactory = () => Promise<RNInstance>

/** 销毁一个 RNInstance（用于 GC） */
export type CommonInstanceDestroyer = (inst: RNInstance) => Promise<void>

/**
 * common bundle 预备池（单槽）。
 * 负责存、取、异步补充、GC 释放，不关心实例如何创建或销毁。
 *
 * 并发安全：若补充正在进行中，takeOrWait() 会等待其完成后再取，
 * 确保业务预加载能复用正在创建中的 common 实例。
 */
export class CommonInstancePool {
  private static readonly TAG = 'CommonInstancePool'

  private instance: RNInstance | null = null
  /** 正在进行的 fill Promise，填充完成后置 null */
  private fillPromise: Promise<void> | null = null

  /** 池中是否有就绪实例 */
  get hasInstance(): boolean {
    console.log(`${TAG_PRELOAD}-${CommonInstancePool.TAG}.hasInstance:result=${this.instance !== null}`)
    return this.instance !== null
  }

  /** 是否正在补充中 */
  get isLoading(): boolean {
    console.log(`${TAG_PRELOAD}-${CommonInstancePool.TAG}.isLoading:result=${this.fillPromise !== null}`)
    return this.fillPromise !== null
  }

  /**
   * 取出实例（同步）。若池为空返回 null。
   * 取走后池变空，调用方应随即调用 fillIfNeeded() 补充。
   */
  take(): RNInstance | null {
    const inst = this.instance
    this.instance = null
    console.log(`${TAG_PRELOAD}-${CommonInstancePool.TAG}.take:instance=${inst}`)
    return inst
  }

  /**
   * 等待补充完成后取出实例。
   * - 池中已有实例：直接取出
   * - 补充进行中：等待完成再取（业务预加载等 common 预加载的场景）
   * - 池空且无补充：返回 null
   */
  async takeOrWait(): Promise<RNInstance | null> {
    if (this.instance !== null) {
      return this.take()
    }
    if (this.fillPromise !== null) {
      console.info(`${TAG_PRELOAD}-${CommonInstancePool.TAG}.takeOrWait: waiting for fill to complete`)
      await this.fillPromise.catch((err) => {
        console.log(`${TAG_PRELOAD}-${CommonInstancePool.TAG}.takeOrWait: error=${err}`)
      })
      const result = this.take()  // fill 失败时 instance 仍为 null，返回 null
      console.info(`${TAG_PRELOAD}-${CommonInstancePool.TAG}.takeOrWait: waiting for fill to complete, result=${result}}`)
      return result
    }
    return null
  }

  /**
   * 若池为空且未在补充中，调用 factory 异步创建并存入。
   * 返回本次（或正在进行的）fill Promise，可选 await。
   */
  fillIfNeeded(factory: CommonInstanceFactory): Promise<void> {
    if (this.instance !== null || this.fillPromise !== null) {
      console.log(`${TAG_PRELOAD}-${CommonInstancePool.TAG}.fillIfNeeded: not need to fill rninstance, instance=${this.instance}, fillPromise=${this.fillPromise}`)
      return this.fillPromise ?? Promise.resolve()
    }
    this.fillPromise = factory()
      .then( ins => {
        this.instance = ins
        console.info(`${TAG_PRELOAD}-${CommonInstancePool.TAG}.fillIfNeeded: common pool filled`)
      })
      .catch(err => {
        console.error(`${TAG_PRELOAD}-${CommonInstancePool.TAG}.fillIfNeeded: failed=${JSON.stringify(err)}`)
      })
      .finally(() => {
        this.fillPromise = null
      })
    return this.fillPromise
  }

  /**
   * GC：若池中有实例，取出并用 destroyer 销毁。
   */
  async drain(destroyer: CommonInstanceDestroyer): Promise<void> {
    if (this.instance === null) return
    const inst = this.instance
    this.instance = null
    try {
      await destroyer(inst)
    } catch (err) {
      console.error(`${TAG_PRELOAD}-${CommonInstancePool.TAG}.drain: failed=${JSON.stringify(err)}`)
    }
  }
}
