import { TurboModuleRegistry } from "react-native";
import type { TurboModule } from "react-native/Libraries/TurboModule/RCTExport";

type ModuleInfo = { bundleName: string; moduleName: string };

export interface Spec extends TurboModule {
  setNavigationKey(key: string): boolean;

  setNavigationState(state: string): boolean;

  dispatchAction(action: string): Promise<boolean>;

  getCurrentModuleInfo(): Promise<ModuleInfo>;

  setShouldInterceptSideSwipe(
    shouldIntercept: boolean,
    routeKey: string,
  ): boolean;

  confirmShouldSideSwipePop(): boolean;

  addListener?(eventName: string): void;
  removeListeners?(count: number): void;
}

export default TurboModuleRegistry.get<Spec>("XRNNavigation") as Spec | null;
