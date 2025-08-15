import { TurboModule } from '@rnoh/react-native-openharmony/ts';
import { TM } from "@rnoh/react-native-openharmony/generated/ts"
import { TurboModuleContext } from '@rnoh/react-native-openharmony/src/main/ets/RNOH/RNOHContext';
import { router } from '@kit.ArkUI';

export class XRNGoDemoModule extends TurboModule implements TM.XRNGODemoModule.Spec {


  constructor(ctx: TurboModuleContext) {
    super(ctx);
  }

  jumpMultiBundleDemo(): void {
    router.pushUrl({url: 'demo/XrnMultiBundlePage'})
  }

  handleOhCrash(): void {
    console.log('demo: =======================> 手动触发鸿蒙崩溃')
    throw new Error('手动触发鸿蒙崩溃');
  }

  handleOhRejectCrash(): void {
    console.log('demo: =======================> 手动触发鸿蒙Promise reject')
    Promise.reject(new Error('promice reject异步报错'))
  }
}
