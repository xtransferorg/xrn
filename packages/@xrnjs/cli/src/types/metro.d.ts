/**
 * TypeScript declaration file for Metro bundler and update notifier modules
 * Provides type definitions for external modules that don't have built-in TypeScript support
 */

/**
 * Type declaration for update-notifier-cjs module
 * Re-exports the default export from update-notifier for CommonJS compatibility
 */
declare module "update-notifier-cjs" {
  import Update from "update-notifier";
  export default Update
}

/**
 * Type declaration for @react-native/metro-config module
 * Provides type definition for Metro configuration utility function
 */
declare module "@react-native/metro-config" {
  export function getDefaultConfig(path: string): any;
}
