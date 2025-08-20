import { requireNativeModule } from "./requireNativeModule";
import { Spec } from "./spec/NativeBundleNavigationModule";

const XRNBundleNavigation = requireNativeModule<Spec>("BundleNavigation");

export { XRNBundleNavigation };
