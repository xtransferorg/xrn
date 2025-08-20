import { TurboModuleRegistry } from "react-native";
import type { TurboModule } from "react-native/Libraries/TurboModule/RCTExport";

export interface Spec extends TurboModule {
  navPushBundleProject(
    bundleName: string,
    moduleName?: string,
    params?: string
  ): void;

  navReplaceBundleProject(
    bundleName: string,
    moduleName?: string,
    params?: string
  ): void;

  publishSingleBundleEvent(eventName: string, params?: string): void;

  publishAllBundleEvent(eventName: string, params?: string): void;

  goBack(): void;
}

export default TurboModuleRegistry.get<Spec>("BundleNavigation") as Spec | null;
