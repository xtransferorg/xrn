import { BundleInfoHook } from "./BundleInfoManager"

/**
 * Bundle 信息
 * 静态数据
 */
export class BundleInfo {

  static BUNDLE_TYPE_MAIN = "main"
  static BUNDLE_TYPE_REMOTE = "remote"

  static DELIVERY_TYPE_INNER = "INNER"
  static DELIVERY_TYPE_DYNAMIC = "DYNAMIC"
  static DELIVERY_TYPE_LOCAL = "LOCAL"

  static DYNAMIC_UNKNOWN_PORT = 1

  private static TAG = "BundleInfo"

  /**
   * bundle name
   */
  readonly bundleName: string = ""
  /**
   * 是否主bundle
   */
  readonly bundleType: string = ""
  /**
   * module 名，main bundle 需要配置
   */
  readonly defaultModuleName: string = ""
  /**
   * 所有的 moduleName
   */
  private readonly moduleNames: string[] = []
  /**
   * CodePush Key
   */
  private readonly codePushKey: string = ""
  /**
   * 本地服务端口
   */
  private port: number = 8081

  private readonly deliveryType: string = BundleInfo.DELIVERY_TYPE_INNER

  /**
   * hook
   */
  private hook: BundleInfoHook | undefined

  constructor(bundleName: string, bundleType: string, defaultModuleName: string, moduleNames: string[], codePushKey: string, port: number, deliveryType?: string) {
    if (bundleName.length == 0) {
      throw new Error(`${BundleInfo.TAG}.constructor:bundleName is empty`)
    }
    this.bundleName = bundleName
    this.bundleType = bundleType
    this.defaultModuleName = defaultModuleName;
    this.moduleNames = moduleNames || [];
    this.codePushKey = codePushKey
    this.port = port
    this.deliveryType = deliveryType
  }

  addAppKey(appKey: string | undefined) {
    if (!appKey) {
      return;
    }
    if (!this.moduleNames.includes(appKey)) {
      this.moduleNames.push(appKey);
    }
  }

  getModuleNames(): string[] {
    return [...this.moduleNames];
  }

  setHook(hook: BundleInfoHook | undefined) {
    this.hook = hook
  }

  /**
   * 是否为 main bundle
   */
  isMainBundle(): boolean {
    return this.bundleType === BundleInfo.BUNDLE_TYPE_MAIN
  }

  /**
   * 返回初始配置的CodePushKey
   * @returns
   */
  getInitCodePushKey(): string {
    return this.codePushKey;
  }

  /**
   * 获取 CodePush key
   * @returns
   */
  getCodePushKey(): string {
    if (this.hook?.hookCodePushKey) {
      return this.hook.hookCodePushKey?.(this) || ""
    } else {
      return this.codePushKey
    }
  }

  /**
   * 获取本地服务端口
   * @returns
   */
  getLocalServerPort(): number {
    if (this.hook?.hookLocalServerPort) {
      return this.hook.hookLocalServerPort(this, this.port)
    }
    return this.port
  }

  /**
   * 设置端口
   * 主要用于 LocalBundle 设置
   * @param port
   */
  setLocalServerPort(port: number) {
    this.port = port;
  }

  /**
   * 获取 js bundle 文件名
   * @returns
   */
  getJSBundleName(): string {
    return this.hook?.hookJSBundleName?.(this) || `oh.${this.bundleName}.bundle`
  }

  /**
   * 获取 本地服务 url
   * @returns
   */
  getLocalServerUrl(): string {
    return this.hook?.hookLocalServerUrl?.(this) || `http://localhost:${this.getLocalServerPort()}/index.bundle?platform=harmony&dev=true&minify=false`
  }

  getDeliveryType(): string {
    return this.deliveryType
  }
}