import { TurboModule } from '@rnoh/react-native-openharmony/ts';
import { TM } from "@rnoh/react-native-openharmony/generated/ts"
import NavigationModule from './reactnative/NativeNavigationModule'
import NavDestinationMgr from './native/NavDestinationMgr';

export class XRNNavigationModule extends TurboModule implements TM.XRNNavigation.Spec {
  setNavigationKey(key: string): void {
    NavigationModule.bindNavigationKey(key)
  }

  dispatchAction(action: string): Promise<boolean> {
    const res = NavigationModule.dispatchAction(action)
    return Promise.resolve(res)
  }

  getCurrentModuleInfo(): Promise<TM.XRNNavigation.ModuleInfo> {
    return Promise.resolve(NavDestinationMgr.top() as TM.XRNNavigation.ModuleInfo)
  }
  
}
