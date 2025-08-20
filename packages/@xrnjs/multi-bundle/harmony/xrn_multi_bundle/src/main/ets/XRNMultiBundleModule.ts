import { TurboModule } from '@rnoh/react-native-openharmony/ts';
import { TM } from "@rnoh/react-native-openharmony/generated/ts"

export class XRNMultiBundleModule extends TurboModule implements TM.XRNMultiBundleModule.Spec {
  multiply(a: number, b: number): Promise<number> {
    return new Promise((resolve) => resolve(a * b));
  }
}
