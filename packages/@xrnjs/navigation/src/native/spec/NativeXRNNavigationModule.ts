import { TurboModuleRegistry } from "react-native";
import type { TurboModule } from "react-native/Libraries/TurboModule/RCTExport";

type ModuleInfo = { bundleName: string; moduleName: string };

export interface Spec extends TurboModule {
  setNavigationKey(key: string): void;

  dispatchAction(action: string): Promise<boolean>;

  getCurrentModuleInfo(): Promise<ModuleInfo>;
}

export default TurboModuleRegistry.get<Spec>("XRNNavigation") as Spec | null;
