export interface DebugBundleItem {
  bundleName: string;
  debugEnable: boolean;
}

export interface IPTextInputProps {
  onValueChange: (value: string) => void;
  ip: string;
}
