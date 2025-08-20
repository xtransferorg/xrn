import { JSON } from '@kit.ArkTS';
import { TurboModule } from '@rnoh/react-native-openharmony/ts';
import { TM } from '@rnoh/react-native-openharmony/generated/ts';
import { RN_INSTANCE_MANAGER } from 'xrn-multi-bundle';
import {
  GlobalNavPathStack,
  replaceModuleContainer,
  RNAppInitialProps,
  startModuleContainer
} from './native/NavHelper';

export class BundleNavigationModule extends TurboModule implements TM.BundleNavigation.Spec {
  navPushBundleProject(bundleName: string, moduleName?: string, params?: string): void {
    const initialProps = JSON.parse(params) as RNAppInitialProps

    startModuleContainer(bundleName, moduleName, initialProps)
  }

  navReplaceBundleProject(bundleName: string, moduleName?: string, params?: string): void {
    const initialProps = JSON.parse(params) as RNAppInitialProps

    replaceModuleContainer(bundleName, moduleName, initialProps)
  }

  publishSingleBundleEvent(eventName: string, params?: string): void {
    this.ctx.rnInstance.emitDeviceEvent(eventName, params)
  }

  publishAllBundleEvent(eventName: string, params?: string): void {
    RN_INSTANCE_MANAGER.getAllRNInstanceWrapper().forEach((item) => {
      item.instance.emitDeviceEvent(eventName, params)
    })
  }

  goBack() {
    GlobalNavPathStack.pop()
  }
}