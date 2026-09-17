declare module "update-notifier-cjs" {
  import Update from "update-notifier";
  export default Update
}

declare module "@react-native/metro-config" {
  export function getDefaultConfig(path: string): any;
}
