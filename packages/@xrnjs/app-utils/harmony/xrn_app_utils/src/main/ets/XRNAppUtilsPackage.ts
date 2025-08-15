import {
  RNPackage,
  TurboModulesFactory,
} from "@rnoh/react-native-openharmony/ts";
import type {
  TurboModule,
  TurboModuleContext,
} from "@rnoh/react-native-openharmony/ts";
import { TM } from "@rnoh/react-native-openharmony/generated/ts";
import { XRNAppUtilsModule } from './XRNAppUtilsModule';

class XRNAppUtilsModulesFactory extends TurboModulesFactory {
  createTurboModule(name: string): TurboModule | null {
    if (name === TM.XRNAppUtilsModule.NAME) {
      return new XRNAppUtilsModule(this.ctx);
    }
    return null;
  }

  hasTurboModule(name: string): boolean {
    return name === TM.XRNAppUtilsModule.NAME;
  }
}

export class XRNAppUtilsPackage extends RNPackage {
  createTurboModulesFactory(ctx: TurboModuleContext): TurboModulesFactory {
    return new XRNAppUtilsModulesFactory(ctx);
  }
}
