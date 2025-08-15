import { SdKVersion } from "./utils/types";

type EntryPoint = string | string[];

export type GenerateApiDataOptions = {
  sdk?: SdKVersion;
  packageName: string;
  entryPoint?: EntryPoint;
};

export type InstallPackageTo = {
  packageName: string;
  currentVersion?: boolean;
  targetPackageName?: string;
  installByYalc?: boolean;
  installByFile?: boolean;
};

export type AddDemoScreenToXrnGo = {
  packageName: string;
  // installByYalc?: boolean;
};

export type HarmonyLibInfo = {
  packageName: string;
  harmonyModuleName: string;
}
export interface AddLibToOhEntryDep {
  packageName: string;
  harmonyModuleName: string;
  sourceCode?: boolean
}

export interface Screen {
  name: string;
  packageName: string;
  sdkPath?: string;
  [key: string]: any;
}
