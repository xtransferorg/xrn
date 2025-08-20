import { JSON5 } from "@wolfx/json5/src/main/ets/json5/";
import { APP_BUNDLE_BUNDLE_INFO_MANAGER } from "../Constants";
import { Context } from '@kit.AbilityKit';
import { buffer } from "@kit.ArkTS";
import { BundleInfo } from "./BundleInfo";

/**
 * Configuration for the project
 */
export class ProjectInfoOption {
  name: string = ""
}

/**
 * Configuration for a single bundle
 */
export class BundleInfoOption {
  /**
   * The name of the bundle
   */
  bundleName: string = ""
  /**
   * The type of bundle (e.g., "main" for main bundle)
   */
  bundleType: string = ""
  /**
   * Default module name for the bundle (required for the main bundle)
   */
  defaultModuleName?: string = ""
  /**
   * List of module names contained in the bundle
   */
  moduleNames: string[] = []
  /**
   * CodePush deployment key
   */
  codePushKey: string = ""
  /**
   * Local server port used in development mode
   */
  port: number = 8081
}

/**
 * Options for initializing the BundleInfoManager
 */
export class BundleInfoManagerOptions {
  project: ProjectInfoOption | undefined
  bundles: BundleInfoOption[] = []
}

/**
 * Hook class used for customizing certain bundle behaviors
 */
export class BundleInfoHook {
  /**
   * Hook method to provide a dynamic CodePush key
   */
  hookCodePushKey: ((info: BundleInfo) => string) | undefined = undefined

  /**
   * Hook method to provide a custom JS bundle filename
   */
  hookJSBundleName: ((info: BundleInfo) => string) | undefined = undefined

  /**
   * Hook method to provide a custom local server URL
   */
  hookLocalServerUrl: ((info: BundleInfo) => string) | undefined = undefined
}

/**
 * Manager class responsible for handling bundle information.
 * Implements singleton pattern.
 */
export class BundleInfoManager {

  private static TAG = "BundleInfoManager"

  static INSTANCE = new BundleInfoManager()

  private static isInitialized = false

  private options: BundleInfoManagerOptions | undefined
  private hook: BundleInfoHook | undefined

  /**
   * List of all bundle info instances
   */
  readonly BUNDLE_INFOS: BundleInfo[] = []

  /**
   * Map of bundleName to BundleInfo instance
   */
  readonly bundleInfoMap = new Map<string, BundleInfo>();

  /**
   * Initialize the manager with configuration and optional hooks
   */
  static init(options: BundleInfoManagerOptions, hook?: BundleInfoHook) {
    BundleInfoManager.assertNotInitialized('init')
    BundleInfoManager.isInitialized = true
    BundleInfoManager.INSTANCE.init(options, hook)
  }

  /**
   * Initialize from raw file content (JSON5)
   */
  static async initWithRawFile(context: Context, rawFilePath: string, hook: BundleInfoHook | undefined) {
    BundleInfoManager.assertNotInitialized('init')
    BundleInfoManager.isInitialized = true
    BundleInfoManager.loadOptionsFromRawFile(context, rawFilePath, hook)
  }

  /**
   * Load and parse configuration file (JSON5)
   */
  private static loadOptionsFromRawFile(context: Context, rawFilePath: string, hook: BundleInfoHook | undefined) {
    const  content : Uint8Array | undefined = context?.resourceManager?.getRawFileContentSync(rawFilePath)
    const result = buffer.from(content).toString('utf-8')
    const options: BundleInfoManagerOptions = JSON5.parse(result)
    BundleInfoManager.INSTANCE.init(options, hook)
  }

  private constructor() {
  }

  private static assertInitialized(tag?: string) {
    if (!BundleInfoManager.isInitialized) {
      throw new Error(`${BundleInfoManager.TAG}.${tag}:BundleInfoManager has not initialized`)
    }
  }

  private static assertNotInitialized(tag?: string) {
    if (BundleInfoManager.isInitialized) {
      throw new Error(`${BundleInfoManager.TAG}.${tag}:BundleInfoManager has initialized`)
    }
  }

  private init(options: BundleInfoManagerOptions, hook: BundleInfoHook | undefined) {
    this.options = options
    this.hook = hook
    for (let index = 0; index < options.bundles.length; index++) {
      const infoOption = options.bundles[index];
      const info = new BundleInfo(infoOption.bundleName, infoOption.bundleType, infoOption.defaultModuleName, infoOption.moduleNames, infoOption.codePushKey, infoOption.port)
      info.setHook(this.hook)
      this.BUNDLE_INFOS.push(info)
      if (this.bundleInfoMap.has(info.bundleName)) {
        throw new Error(`${BundleInfoManager.TAG}.constructor:bundle name has set, info.bundleName=${info.bundleName}`)
      }
      this.bundleInfoMap.set(info.bundleName, info)
    }
    AppStorage.setOrCreate<BundleInfoManager>(APP_BUNDLE_BUNDLE_INFO_MANAGER, this)
  }

  /**
   * Get BundleInfo by bundle name
   * @param bundleName
   * @returns
   */
  getBundleInfo(bundleName: string): BundleInfo | undefined {
    BundleInfoManager.assertInitialized('getBundleInfo')
    return this.bundleInfoMap.get(bundleName)
  }

  /**
   * Check if a bundle has already been registered
   * @param bundleName
   * @returns
   */
  isBundleRegistered(bundleName: string): boolean {
    BundleInfoManager.assertInitialized('isBundleRegistered')
    return this.getBundleInfo(bundleName) ? true : false
  }

  /**
   * Get the main bundle
   * @returns
   */
  getMainBundleInfo(): BundleInfo | null {
    BundleInfoManager.assertInitialized('getMainBundleInfo')
    const mainBundle = this.BUNDLE_INFOS.filter((value: BundleInfo, index: number, array: BundleInfo[]) => {
      return value.bundleType === BundleInfo.BUNDLE_TYPE_MAIN
    })
    return mainBundle.length > 0 ? mainBundle[0] : null
  }

  /**
   * Find bundle info by matching local server port
   * @param port
   * @returns
   */
  findBundleInfoByPort(port: string | number): BundleInfo | null {
    const item = this.options?.bundles.find(it => it.port.toString() === port.toString())
    if(item?.bundleName) {
      return this.getBundleInfo(item.bundleName)
    }
    return null
  }

}







