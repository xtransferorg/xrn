import { requireNativeModule } from "@xrnjs/modules-core";

import { Spec as NativeXRNBundleModuleSpec } from "./NativeXRNBundleModule";

export {
  BundleInfoList,
  BundleInfo,
  CodePushInfo,
} from "./NativeXRNBundleModule";
export { NativeXRNBundleModuleSpec };

export const XRNBundle =
  requireNativeModule<NativeXRNBundleModuleSpec>("XRNBundleModule");
