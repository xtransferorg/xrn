import { TurboModule } from '@rnoh/react-native-openharmony/ts';
import { TM } from "@rnoh/react-native-openharmony/generated/ts";
import { TurboModuleContext } from '@rnoh/react-native-openharmony/src/main/ets/RNOH/RNOHContext';
import { RN_INSTANCE_MANAGER, BundleInfoManager } from "@xrnjs/multi-bundle/ts";

export class XRNDebugToolsModule extends TurboModule implements TM.XRNDebugToolsModule.Spec {

  bundleName: string;

  constructor(ctx: TurboModuleContext, bundleName: string) {
    super(ctx);
    this.bundleName = bundleName;
  }

  registerDevBundle(bundleName: string, port: string): boolean {
    const localPort = Number(port)
    if (!bundleName || !localPort) {
      return false;
    }
    BundleInfoManager.INSTANCE.registerDevBundleInfo(bundleName, localPort)
    return true
  }

  cleanAppCache(): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      
    });
  }

  reloadBundle(): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      RN_INSTANCE_MANAGER?.reCreateRNInstance(this.bundleName);
      resolve(true);
    });
  }

  getAllBundlesDataSync(): Promise<Object[]> {
    return new Promise<Object[]>((resolve, reject) => {
      
    });
  }

  nativeCrash(): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      
    });
  }

  routeInfo(): Promise<Object[]> {
    return new Promise<Object[]>((resolve, reject) => {
      
    });
  }

  toggleInspector(): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      
    });
  }

  getInspectorIsShown(): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      
    });
  }

  togglePerfMonitor(): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      
    });
  }

  getPerfMonitorIsShown(): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      
    });
  }

  toggleMemoryLeak(): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      // noop placeholder
      resolve(true);
    });
  }

  getMemoryLeakIsShown(): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      // noop placeholder
      resolve(false);
    });
  }

  pingStart(host: string): Promise<Object> {
    return new Promise<Object>((resolve, reject) => {
      
    });
  }

  dnsStart(host: string):Promise<Object> {
    return new Promise<Object>((resolve, reject) => {
      
    });
  }

  proxyInfo(url: string): Promise<Object> {
    return new Promise<Object>((resolve, reject) => {
      
    });
  }

  // Android Only
  getBundleDebugConfig(bundleName: string): Promise<Object> {
    return Promise.resolve({});
  }
  setBundleDebugConfig(bundleName: string, config: Object): boolean {
    return true
  }
  getNativeStorageSync(spName: string, key: string): string | null {
    return "";
  }
  setNativeStorageSync(spName: string, key: string, value: string): boolean {
    return false;
  }
  getBundleHostIPSync(): string {
    return ""
  }
  setBundleHostIP(ip: string): boolean {
    return true
  }
  openConnection(host: string, port: string, room: string): boolean {
    return true
  }

}
