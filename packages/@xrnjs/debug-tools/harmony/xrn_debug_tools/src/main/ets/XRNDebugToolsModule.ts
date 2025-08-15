import { TurboModule } from '@rnoh/react-native-openharmony/ts';
import { TM } from "@rnoh/react-native-openharmony/generated/ts";
import { TurboModuleContext } from '@rnoh/react-native-openharmony/src/main/ets/RNOH/RNOHContext';
import { RN_INSTANCE_MANAGER } from "xrn-multi-bundle/ts";
import { GlobalNavPathStack } from "xrn-navigation/ts"

export class XRNDebugToolsModule extends TurboModule implements TM.XRNDebugToolsModule.Spec {

  bundleName: string;

  constructor(ctx: TurboModuleContext, bundleName: string) {
    super(ctx);
    this.bundleName = bundleName;
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
      const size = GlobalNavPathStack.size()
      type PageInfo = {
        bundleName: string;
        moduleName: string;
      };
      type ElementInfo = {
        bundleName: string;
        moduleName: string;
      };
      let bundleInfos: PageInfo[] = [];
      for (let index = 0; index < size; index++) {
        const element = GlobalNavPathStack.getParamByIndex(index) as ElementInfo
        const bundleName = element?.bundleName
        const moduleName = element?.moduleName
        bundleInfos.push({ bundleName, moduleName })
        resolve(bundleInfos)
      }
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
  
}
