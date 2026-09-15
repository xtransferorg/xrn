export interface DebugBundleItem {
  bundleName: string; // bundle名称
  enableDebug: boolean; // 是否开启调试
  enableEditPort: boolean; // 是否允许编辑端口号
  port: string; // 端口号
  enableCodepush: boolean; // 是否支持热更新
  enableCommon: boolean; // 是否启用common包
}

export interface IPTextInputProps {
  onValueChange: (value: string) => void;
  ip: string;
}
