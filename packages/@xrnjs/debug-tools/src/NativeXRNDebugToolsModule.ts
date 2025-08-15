import { TurboModuleRegistry } from "react-native";
import type { TurboModule } from "react-native/Libraries/TurboModule/RCTExport";

export interface Spec extends TurboModule {
  cleanAppCache(): Promise<boolean>;
  reloadBundle(): Promise<boolean>;
  getAllBundlesDataSync(): Promise<Object[]>;
  nativeCrash(): Promise<boolean>;
  routeInfo(): Promise<Object[]>;
  toggleInspector(): Promise<boolean>;
  getInspectorIsShown(): Promise<boolean>;
  togglePerfMonitor(): Promise<boolean>;
  getPerfMonitorIsShown():Promise<boolean>;
  pingStart(host: string): Promise<Object>;
  dnsStart(host: string): Promise<Object>;
  proxyInfo(url: string): Promise<Object>;
}

export default TurboModuleRegistry.get<Spec>("XRNDebugToolsModule") as Spec | null;
