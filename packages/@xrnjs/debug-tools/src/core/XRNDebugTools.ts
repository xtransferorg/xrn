import { requireNativeModule } from "@xrnjs/modules-core";
import { XRNDebugToolsType } from "./types";

const XRNDebugModule = requireNativeModule("XRNDebugToolsModule");

export const XRNDebugTools: XRNDebugToolsType = {

  cleanAppCache: () => {
    return new Promise<boolean>((resolve, reject) => {
      XRNDebugModule?.cleanAppCache()
        .then((res) => {
          resolve(res)
        })
        .catch((err: any) => {
          reject(err)
        });
    });
  },

  reloadBundle: () => {
    return new Promise<boolean>((resolve, reject) => {
      XRNDebugModule?.reloadBundle()
        .then((res) => {
          resolve(res)
        })
        .catch((err: any) => {
          reject(err)
        });
    });
  },

  getAllBundlesDataSync: () => {
    return new Promise<Object[]>((resolve, reject) => {
      XRNDebugModule?.getAllBundlesDataSync()
        .then((res: Object[]) => {
          resolve(res)
        })
        .catch((err: any) => {
          reject(err)
        });
    });
  },

  nativeCrash: () => {
    return new Promise<boolean>((resolve, reject) => {
      XRNDebugModule?.nativeCrash()
        .then((res: boolean) => {
          resolve(res)
        })
        .catch((err: any) => {
          reject(err)
        });
    });
  },

  routeInfo: () => {
    return new Promise<Object[]>((resolve, reject) => {
      XRNDebugModule?.routeInfo()
        .then((res: Object[]) => {
          resolve(res)
        })
        .catch((err: any) => {
          reject(err)
        });
    });
  },

  toggleInspector: () => {
    return new Promise<boolean>((resolve, reject) => {
      XRNDebugModule?.toggleInspector()
        .then((res: boolean) => {
          resolve(res)
        })
        .catch((err: any) => {
          reject(err)
        });
    });
  },

  getInspectorIsShown: () => {
    return new Promise<boolean>((resolve, reject) => {
      XRNDebugModule?.getInspectorIsShown()
        .then((res: boolean) => {
          resolve(res)
        })
        .catch((err: any) => {
          reject(err)
        });
    });
  },

  togglePerfMonitor: () => {
    return new Promise<boolean>((resolve, reject) => {
      XRNDebugModule?.togglePerfMonitor()
        .then((res: boolean) => {
          resolve(res)
        })
        .catch((err: any) => {
          reject(err)
        });
    });
  },

  getPerfMonitorIsShown: () => {
    return new Promise<boolean>((resolve, reject) => {
      XRNDebugModule?.getPerfMonitorIsShown()
        .then((res: boolean) => {
          resolve(res)
        })
        .catch((err: any) => {
          reject(err)
        });
    });
  },

  pingStart: (host: string) => {
    return new Promise<Object>((resolve, reject) => {
      XRNDebugModule?.pingStart(host)
        .then((res: Object) => {
          resolve(res)
        })
        .catch((err: any) => {
          reject(err)
        });
    });
  },

  dnsStart: (host: string) => {
    return new Promise<Object>((resolve, reject) => {
      XRNDebugModule?.dnsStart(host)
        .then((res: Object) => {
          resolve(res)
        })
        .catch((err: any) => {
          reject(err)
        });
    });
  },

  proxyInfo: (url: string) => {
    return new Promise<Object>((resolve, reject) => {
      XRNDebugModule?.proxyInfo(url)
        .then((res: Object) => {
          resolve(res)
        })
        .catch((err: any) => {
          reject(err)
        });
    });
  }

}