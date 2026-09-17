import { TurboModule } from '@rnoh/react-native-openharmony/ts';
import { TM } from "@rnoh/react-native-openharmony/generated/ts"
import NavigationModule from './reactnative/NativeNavigationModule'
import NavDestinationMgr from './native/NavDestinationMgr';

export class XRNNavigationModule extends TurboModule implements TM.XRNNavigation.Spec {
  setNavigationKey(key: string): boolean {
    NavigationModule.bindNavigationKey(key)
    return true
  }

  setNavigationState(state: string): boolean {
    NavigationModule.bindNavigationState(state)
    return true
  }

  dispatchAction(action: string): Promise<boolean> {
    const res = NavigationModule.dispatchAction(action)
    return Promise.resolve(res)
  }

  getCurrentModuleInfo(): Promise<TM.XRNNavigation.ModuleInfo> {
    return Promise.resolve(NavDestinationMgr.top() as TM.XRNNavigation.ModuleInfo)
  }
  
  // 鸿蒙方法添加空实现避免报错
  setShouldInterceptSideSwipe(shouldIntercept: boolean, routeKey: string): boolean {
    return true
  }

  confirmShouldSideSwipePop(): boolean {
    return true
  }

  addListener(eventName: string): void {
  }

  removeListeners(count: number): void {
  }
}
