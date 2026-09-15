import { requireNativeModule } from "@xrnjs/modules-core";

import type { Spec } from "./NativeXRNNetworkModule";

export const XRNNetwork = requireNativeModule<Spec>("XRNNetworkModule");

export type { Spec as XRNNetworkModuleSpec } from "./NativeXRNNetworkModule";
