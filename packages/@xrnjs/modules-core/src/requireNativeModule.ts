import { NativeModules, TurboModuleRegistry } from "react-native";

import Platform from "./Platform";

const isHarmony = Platform.OS === "harmony";

/**
 * Imports the native module registered with given name. In the first place it tries to load
 * the module installed through the JSI host object and then falls back to the bridge proxy module.
 * Notice that the modules loaded from the proxy may not support some features like synchronous functions.
 *
 * @param moduleName Name of the requested native module.
 * @returns Object representing the native module.
 * @throws Error when there is no native module with given name.
 */
export function requireNativeModule<ModuleType = any>(
  moduleName: string
): ModuleType {
  const nativeModule = requireOptionalNativeModule<ModuleType>(moduleName);

  if (!isHarmony && !nativeModule) {
    throw new Error(`Cannot find native module '${moduleName}'`);
  }

  /*
  if (isHarmony) {
    console.log("获取鸿蒙native module");
  }
  */

  //@ts-ignore
  return nativeModule;
}

/**
 * Imports the native module registered with the given name. The same as `requireNativeModule`,
 * but returns `null` when the module cannot be found instead of throwing an error.
 *
 * @param moduleName Name of the requested native module.
 * @returns Object representing the native module or `null` when it cannot be found.
 */
export function requireOptionalNativeModule<ModuleType = any>(
  moduleName: string
): ModuleType | null {
  const resolvedTurboModule = TurboModuleRegistry?.get(
    moduleName
  ) as ModuleType | null;
  if (resolvedTurboModule) {
    return resolvedTurboModule;
  }
  return NativeModules[moduleName] as ModuleType | null;
}
