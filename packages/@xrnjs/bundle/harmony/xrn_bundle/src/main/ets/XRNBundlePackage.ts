import {
  RNPackage,
  TurboModulesFactory,
} from "@rnoh/react-native-openharmony/ts";
import type {
  TurboModule,
  TurboModuleContext,
} from "@rnoh/react-native-openharmony/ts";
import { TM } from "@rnoh/react-native-openharmony/generated/ts";
import { XRNBundleModule } from './XRNBundleModule';
import { RNPackageContext } from "@rnoh/react-native-openharmony/src/main/ets/RNOH/RNPackage";

class XRNBundleModulesFactory extends TurboModulesFactory {

  bundleName: string

  constructor(ctx: TurboModuleContext, bundleName: string) {
    super(ctx)
    this.bundleName = bundleName;
  }

  createTurboModule(name: string): TurboModule | null {
    if (name === TM.XRNBundleModule.NAME) {
      return new XRNBundleModule(this.ctx, this.bundleName);
    }
    return null;
  }

  hasTurboModule(name: string): boolean {
    return name === TM.XRNBundleModule.NAME;
  }
}

export class XRNBundlePackage extends RNPackage {

  bundleName: string

  constructor(ctx: RNPackageContext, bundleName: string) {
    super(ctx);
    this.bundleName = bundleName;
  }

  createTurboModulesFactory(ctx: TurboModuleContext): TurboModulesFactory {
    return new XRNBundleModulesFactory(ctx, this.bundleName);
  }
}
