import { requireNativeModule } from "@xrnjs/modules-core";

import { Spec as XRNLoadingModuleSpec } from "./NativeXRNLoadingModule";

const XRNLoading =
  requireNativeModule<XRNLoadingModuleSpec>("XRNLoadingModule");

export { XRNLoadingModuleSpec, XRNLoading };
