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
  toggleMemoryLeak(): Promise<boolean>;
  getMemoryLeakIsShown(): Promise<boolean>;
  pingStart(host: string): Promise<Object>;
  dnsStart(host: string): Promise<Object>;
  proxyInfo(url: string): Promise<Object>;
  
  registerDevBundle?(bundleName: string, port: string): boolean;
  // Android Only
  getBundleDebugConfig?(bundleName: string): Promise<Object>;
  setBundleDebugConfig?(bundleName: string, config: Object): boolean;
  getNativeStorageSync?(spName: string, key: string): string | null;
  setNativeStorageSync?(spName: string, key: string, value: string): boolean;
  getBundleHostIPSync?(): string;
  setBundleHostIP?(ip: string): boolean;
  openConnection?(host: string, port: string, room: string): boolean;
}

export default TurboModuleRegistry.get<Spec>("XRNDebugToolsModule") as Spec | null;
