import {
  RNPackage,
  TurboModulesFactory,
} from "@rnoh/react-native-openharmony/ts";
import type {
  TurboModule,
  TurboModuleContext,
} from "@rnoh/react-native-openharmony/ts";
import { TM } from "@rnoh/react-native-openharmony/generated/ts";
import { XRNGoDemoModule } from './XRNGoDemoModule';
import { RNPackageContext } from "@rnoh/react-native-openharmony/src/main/ets/RNOH/RNPackage";

class XRNGoDemoModulesFactory extends TurboModulesFactory {

  bundleName: string

  constructor(ctx: TurboModuleContext) {
    super(ctx)
  }

  createTurboModule(name: string): TurboModule | null {
    if (name === TM.XRNGODemoModule.NAME) {
      return new XRNGoDemoModule(this.ctx);
    }
    return null;
  }

  hasTurboModule(name: string): boolean {
    return name === TM.XRNGODemoModule.NAME;
  }
}

export class XRNGoDemoPackage extends RNPackage {

  constructor(ctx: RNPackageContext) {
    super(ctx);
  }

  createTurboModulesFactory(ctx: TurboModuleContext): TurboModulesFactory {
    return new XRNGoDemoModulesFactory(ctx);
  }
}
