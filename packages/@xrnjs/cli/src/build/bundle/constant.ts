import { Platform } from "../typing";

export const BundleExt: Record<Platform, string> = {
  [Platform.Android]: "bundle",
  [Platform.iOS]: "jsbundle",
  [Platform.Harmony]: "bundle"
};

export const BundleFileName: Record<Platform, string> = {
  [Platform.Android]: "index.",
  [Platform.iOS]: "",
  [Platform.Harmony]: "oh."
};

export const EntryFileName = "index.ts";
