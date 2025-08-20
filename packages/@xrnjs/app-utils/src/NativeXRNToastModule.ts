import { TurboModuleRegistry } from "react-native";
import type { TurboModule } from "react-native/Libraries/TurboModule/RCTExport";

export interface Spec extends TurboModule {
  showToast(message: string, duration: string): Promise<boolean>;
  hideToast(): Promise<boolean>;
}

export default TurboModuleRegistry.get<Spec>(
  "XRNToastModule",
) as Spec | null;
