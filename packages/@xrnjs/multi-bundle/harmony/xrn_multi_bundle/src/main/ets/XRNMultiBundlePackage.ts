import {
  RNPackage,
  TurboModulesFactory,
} from "@rnoh/react-native-openharmony/ts";
import type {
  TurboModule,
  TurboModuleContext,
} from "@rnoh/react-native-openharmony/ts";
import { TM } from "@rnoh/react-native-openharmony/generated/ts";
import { XRNMultiBundleModule } from './XRNMultiBundleModule';

class XRNMultiBundleModulesFactory extends TurboModulesFactory {
  createTurboModule(name: string): TurboModule | null {
    if (name === TM.XRNMultiBundleModule.NAME) {
      return new XRNMultiBundleModule(this.ctx);
    }
    return null;
  }

  hasTurboModule(name: string): boolean {
    return name === TM.XRNMultiBundleModule.NAME;
  }
}

export class XRNMultiBundlePackage extends RNPackage {
  createTurboModulesFactory(ctx: TurboModuleContext): TurboModulesFactory {
    return new XRNMultiBundleModulesFactory(ctx);
  }
}
