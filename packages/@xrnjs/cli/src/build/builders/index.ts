import { buildJobContext } from "../BuildJobContext";
import { Platform } from "../typing";
import { AndroidBuilder } from "./AndroidBuilder";
import { BaseBuilder } from "./BaseBuilder";
import { HarmonyBuilder } from "./HarmonyBuilder";
import { IOSBuilder } from "./IOSBuilder";

export const getBuilder = () => {
  let builder: BaseBuilder;
  switch (buildJobContext.platform) {
    case Platform.Android:
      builder = new AndroidBuilder(buildJobContext);
      break;
    case Platform.iOS:
      builder = new IOSBuilder(buildJobContext);
      break;
    case Platform.Harmony:
      builder = new HarmonyBuilder(buildJobContext);
      break;
    default:
      throw new Error("不支持的平台类型");
  }
  return builder;
};
