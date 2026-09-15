/**
 * Ambient type declaration for @react-native/community-cli-plugin (RN 0.77).
 * The package ships only a CommonJS dist/ with `exports` map and no `.d.ts`,
 * so tsc cannot resolve types. This stub declares the exported members the CLI
 * consumes. Runtime behavior comes from the package; this only satisfies tsc.
 */

declare module '@react-native/community-cli-plugin' {
  export interface CommandLineArg {
    name: string
    description?: string
    parse?: (value: string) => unknown
    default?: unknown
  }

  export interface CliCommand {
    name: string
    description?: string
    func: (...args: any[]) => any
    options?: CommandLineArg[]
    examples?: string[]
  }

  export const bundleCommand: CliCommand
  export const startCommand: CliCommand

  export interface BuildBundleOptions {
    entryFile: string
    platform: string
    dev?: boolean
    minify?: boolean
    bundleOutput?: string
    sourcemapOutput?: string
    assetsDest?: string
    config?: any
    verbose?: boolean
    resetCache?: boolean
    resetGlobalCache?: boolean
    sourcemapUseAbsolutePath?: boolean
    generateStaticViewConfigs?: boolean
    [key: string]: any
  }

  // Signature matches internal usage: buildBundleWithConfig(options, config)
  export function unstable_buildBundleWithConfig(
    options: BuildBundleOptions,
    config: any
  ): Promise<void>
}

declare module '@react-native/community-cli-plugin/dist/commands/bundle' {
  export const bundleCommand: any
}

declare module '@react-native/community-cli-plugin/dist/commands/start' {
  export const startCommand: any
}

declare module '@react-native/community-cli-plugin/dist/commands/bundle/buildBundle' {
  export function unstable_buildBundleWithConfig(
    entryFile: string,
    config: any,
    options: any
  ): Promise<void>
}
