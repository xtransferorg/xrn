import { TurboModuleRegistry } from "react-native";
import type { TurboModule } from "react-native/Libraries/TurboModule/RCTExport";

export interface Spec extends TurboModule {
  multiply(a: number, b: number): Promise<number>;
}

export default TurboModuleRegistry.get<Spec>("XRNAssetLoaderModule") as Spec | null;
