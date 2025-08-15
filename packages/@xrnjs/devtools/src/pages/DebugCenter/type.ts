import { ImageSourcePropType, PlatformOSType } from "react-native";
import { Platform } from "@xrnjs/modules-core";

export interface DebugCenterDataSource {
  title: string;
  data: DebugCenterSectionItem[][];
}

export interface DebugCenterSectionItem {
  text: string;
  entryType: string;
  routeName?: string;
  debugEnable?: boolean;
  icon: ImageSourcePropType;
  platforms?: (typeof Platform.OS)[];
  url?: string;
  channel?: string;
}
