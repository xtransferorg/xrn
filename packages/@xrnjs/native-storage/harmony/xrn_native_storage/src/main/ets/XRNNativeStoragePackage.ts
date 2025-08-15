import {
  RNPackage,
  TurboModulesFactory,
} from "@rnoh/react-native-openharmony/ts";
import type {
  TurboModule,
  TurboModuleContext,
} from "@rnoh/react-native-openharmony/ts";
import { TM } from "@rnoh/react-native-openharmony/generated/ts";
import { XRNNativeStorageModule } from './XRNNativeStorageModule';

class XRNNativeStorageModulesFactory extends TurboModulesFactory {
  createTurboModule(name: string): TurboModule | null {
    if (this.hasTurboModule(name)) {
      return new XRNNativeStorageModule(this.ctx);
    }
    return null;
  }

  hasTurboModule(name: string): boolean {
    return name === TM.XRNNativeStorageModule.NAME;
  }
}

export class XRNNativeStoragePackage extends RNPackage {
  createTurboModulesFactory(ctx: TurboModuleContext): TurboModulesFactory {
    return new XRNNativeStorageModulesFactory(ctx);
  }
}
