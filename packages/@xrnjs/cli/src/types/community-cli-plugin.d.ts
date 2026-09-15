// TODO: 后续可改为引用官方导出类型或自建最小接口，收窄 any，提升类型安全（依赖 @react-native/community-cli-plugin 的类型发布情况）。

declare module "@react-native/community-cli-plugin/*" {
  const value: any;
  export default value;
  export const unstable_buildBundleWithConfig: any;
}

declare module "@react-native/community-cli-plugin" {
  export const bundleCommand: any;
  export const startCommand: any;
  export const unstable_buildBundleWithConfig: any;
}
