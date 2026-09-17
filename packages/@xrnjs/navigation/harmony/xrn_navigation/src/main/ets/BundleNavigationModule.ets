import { JSON } from '@kit.ArkTS';
import { TurboModule } from '@rnoh/react-native-openharmony/ts';
import { TM } from '@rnoh/react-native-openharmony/generated/ts';
import { RN_INSTANCE_MANAGER } from '@xrnjs/multi-bundle';
import {
  GlobalNavPathStack,
  replaceModuleContainer,
  RNAppInitialProps,
  startModuleContainer
} from './native/NavHelper';

export class BundleNavigationModule extends TurboModule implements TM.BundleNavigation.Spec {
  navPushBundleProject(bundleName: string, moduleName?: string, params?: string): boolean {
    const initialProps = JSON.parse(params) as RNAppInitialProps

    startModuleContainer(bundleName, moduleName, initialProps)
    return true
  }

  navReplaceBundleProject(bundleName: string, moduleName?: string, params?: string): boolean {
    const initialProps = JSON.parse(params) as RNAppInitialProps

    replaceModuleContainer(bundleName, moduleName, initialProps)
    return true
  }

  publishSingleBundleEvent(eventName: string, params?: string): boolean {
    this.ctx.rnInstance.emitDeviceEvent(eventName, params)
    return true
  }

  publishAllBundleEvent(eventName: string, params?: string): boolean {
    RN_INSTANCE_MANAGER.getAllRNInstanceWrapper().forEach((item) => {
      item.instance.emitDeviceEvent(eventName, params)
    })
    return true
  }

  goBack(): boolean {
    GlobalNavPathStack.pop()
    return true
  }

  gestureEnabled(enable: boolean): boolean {
    return true
  }

  addListener(eventName: string): void {
  }

  removeListeners(count: number): void {
  }
}
