import { requireNativeModule } from "./requireNativeModule";
import { Spec } from "./spec/NativeXRNNavigationModule";

const XRNNavigation = requireNativeModule<Spec>("XRNNavigation");

export { XRNNavigation };
