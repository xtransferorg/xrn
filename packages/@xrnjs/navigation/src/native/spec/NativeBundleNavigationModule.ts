import { TurboModuleRegistry } from "react-native";
import type { TurboModule } from "react-native/Libraries/TurboModule/RCTExport";

export interface Spec extends TurboModule {
  navPushBundleProject(
    bundleName: string,
    moduleName?: string,
    params?: string,
  ): boolean;

  navReplaceBundleProject(
    bundleName: string,
    moduleName?: string,
    params?: string,
  ): boolean;

  publishSingleBundleEvent(eventName: string, params?: string): boolean;

  publishAllBundleEvent(eventName: string, params?: string): boolean;

  goBack(): boolean;

  gestureEnabled?(enable: boolean): boolean;

  addListener?(eventName: string): void;
  removeListeners?(count: number): void;
}

export default TurboModuleRegistry.get<Spec>("BundleNavigation") as Spec | null;
