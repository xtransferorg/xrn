import { requireNativeModule } from "@xrnjs/modules-core";

import { Spec } from "./spec/NativeBundleNavigationModule";

const XRNBundleNavigation = requireNativeModule<Spec>("BundleNavigation");

export { XRNBundleNavigation };
