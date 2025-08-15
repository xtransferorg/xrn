import { BundleInfoHook } from "./BundleInfoManager"

/**
 * Bundle information.
 */
export class BundleInfo {

  static BUNDLE_TYPE_MAIN = "main"

  private static TAG = "BundleInfo"

  /**
   * Name of the bundle.
   */
  readonly bundleName: string = ""
  /**
   * Type of the bundle (e.g., main).
   */
  readonly bundleType: string = ""
  /**
   * Default module name, required for the main bundle.
   */
  readonly defaultModuleName: string = ""
  /**
   * List of all module names.
   */
  private readonly moduleNames: string[] = []
  /**
   * Initial CodePush deployment key.
   */
  private readonly codePushKey: string = ""
  /**
   * Local development server port.
   */
  private readonly port: number = 8081

  /**
   * Optional hook for overriding default behavior.
   */
  private hook: BundleInfoHook | undefined

  constructor(bundleName: string, bundleType: string, defaultModuleName: string, moduleNames: string[], codePushKey: string, port: number) {
    if (bundleName.length == 0) {
      throw new Error(`${BundleInfo.TAG}.constructor:bundleName is empty`)
    }
    this.bundleName = bundleName
    this.bundleType = bundleType
    this.defaultModuleName = defaultModuleName;
    this.moduleNames = moduleNames || [];
    this.codePushKey = codePushKey
    this.port = port
  }

  /**
   * Adds a new module name (appKey) to the list if not already included.
   * @param appKey
   */
  addAppKey(appKey: string | undefined) {
    if (!appKey) {
      return;
    }
    if (!this.moduleNames.includes(appKey)) {
      this.moduleNames.push(appKey);
    }
  }

  /**
   * Returns a copy of all module names.
   * @returns
   */
  getModuleNames(): string[] {
    return [...this.moduleNames];
  }

  /**
   * Sets a custom hook for overriding behavior.
   * @param hook
   */
  setHook(hook: BundleInfoHook | undefined) {
    this.hook = hook
  }

  /**
   * Checks whether this bundle is the main bundle.
   */
  isMainBundle(): boolean {
    return this.bundleType === BundleInfo.BUNDLE_TYPE_MAIN
  }

  /**
   * Returns the initial CodePush deployment key.
   * @returns
   */
  getInitCodePushKey(): string {
    return this.codePushKey;
  }

  /**
   * Returns the CodePush deployment key, possibly overridden by the hook.
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
   * Returns the local development server port.
   * @returns
   */
  getLocalServerPort(): number {
    return this.port
  }

  /**
   * Returns the JS bundle file name, optionally overridden by the hook.
   * @returns
   */
  getJSBundleName(): string {
    return this.hook?.hookJSBundleName?.(this) || `oh.${this.bundleName}.bundle`
  }

  /**
   * Returns the full local server URL for bundle loading.
   * @returns
   */
  getLocalServerUrl(): string {
    return this.hook?.hookLocalServerUrl?.(this) || `http://localhost:${this.getLocalServerPort()}/index.bundle?platform=harmony&dev=true&minify=false`
  }

}