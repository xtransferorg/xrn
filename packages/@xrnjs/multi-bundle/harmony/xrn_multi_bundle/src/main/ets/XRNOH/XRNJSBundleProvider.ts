import {
  AnyJSBundleProvider,
  JSBundleProvider,
  TraceJSBundleProviderDecorator} from "@rnoh/react-native-openharmony/src/main/ets/RNOH/JSBundleProvider";


/**
 * Extension interface for JSBundleProvider
 */
export interface JSBundleProviderEx {
  /**
   * Dynamically updates the list of app-level storage keys.
   *
   * @param appKeys - An array of string keys representing app-level properties.
   */
  updateAppKeys(appKeys: string[]);
}

function getAppKeysInner(jsBundleProvider: JSBundleProvider): string[] {
  let array: string[] = (jsBundleProvider as any).appKeys
  if (!array) {
    array = [];
    (this as any).appKeys = array
  }
  return array
}

/**
 * Injects app-level storage keys into the given JSBundleProvider.
 *
 * @param jsBundleProvider - The JS bundle provider to update.
 * @param appKeys - List of storage keys to apply.
 */
export function updateJSBundleProviderAppKeys(jsBundleProvider: JSBundleProvider, appKeys: string[]) {

  if (isJSBundleProviderEx(jsBundleProvider)) {
    // Call updateAppKeys if JSBundleProvider implements the extended JSBundleProviderEx interface.
    jsBundleProvider.updateAppKeys(appKeys)
  } else if ('appKeys' in jsBundleProvider) {
    // Otherwise, directly update the internal appKeys member variable.
    const appKeyArray = getAppKeysInner(jsBundleProvider)
    appKeyArray.length = 0
    appKeys.forEach((value) => {
      appKeyArray.push(value)
    })
  } else {
    console.warn('updateJSBundleProviderAppKeys invalid jsBundleProvider = ', jsBundleProvider.constructor.name)
  }
}

function isJSBundleProviderEx(jsBundleProvider: any): jsBundleProvider is JSBundleProviderEx {
  // The method name must be consistent with the one in JSBundleProviderEx.
	return jsBundleProvider && typeof jsBundleProvider.updateAppKeys === 'function'
}

export class XRNAnyJSBundleProvider extends AnyJSBundleProvider implements JSBundleProviderEx {

  private getJsBundleProviders(): JSBundleProvider[] {
    return (this as any).jsBundleProviders
  }

  updateAppKeys(appKeys: string[]): void {
    const jsBundleProviders = this.getJsBundleProviders()
    for (const provider of jsBundleProviders) {
      updateJSBundleProviderAppKeys(provider, appKeys)
    }
  }

}

export class XRNTraceJSBundleProviderDecorator extends TraceJSBundleProviderDecorator implements JSBundleProviderEx {

  private getJSBundleProvider(): JSBundleProvider | undefined {
    return (this as any).jsBundleProvider
  }

  updateAppKeys(appKeys: string[]): void {
    const jsBundleProvider = this.getJSBundleProvider()
    updateJSBundleProviderAppKeys(jsBundleProvider, appKeys)
  }

}
