import { requireNativeModule } from "@xrnjs/modules-core";

import { Spec } from "./spec/NativeXRNNavigationModule";

const XRNNavigation = requireNativeModule<Spec>("XRNNavigation");

export { XRNNavigation };
