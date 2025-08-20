import { TurboModuleRegistry } from "react-native";
import type { TurboModule } from "react-native/Libraries/TurboModule/RCTExport";

export interface Spec extends TurboModule {
    jumpMultiBundleDemo(): void;
    handleOhCrash(): void;
    handleOhRejectCrash(): void;
}

export default TurboModuleRegistry.get<Spec>("XRNGODemoModule") as Spec | null;
