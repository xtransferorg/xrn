import { Platform as ReactNativePlatform } from "react-native";
import type { PlatformOSType } from "react-native";

export type PlatformSelectOSType = PlatformOSType | "harmony";

export type PlatformSelect = <T>(specifics: {
  [platform in PlatformSelectOSType]?: T;
}) => T;

const OS = ReactNativePlatform.OS as PlatformSelectOSType;

const nativeSelect = function select<T>(specifics: {
  [platform in PlatformSelectOSType]?: T;
}): T | undefined {
  if (!OS) return undefined;
  if (specifics.hasOwnProperty(OS)) {
    return specifics[OS]!;
  } else if (OS !== "web" && specifics.hasOwnProperty("native")) {
    return specifics.native!;
  }
  // do nothing...
  return undefined;
};

const Platform = {
  OS,
  select: nativeSelect as PlatformSelect,
};

export default Platform;
