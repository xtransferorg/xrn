import {
  RNPackage,
  TurboModulesFactory,
} from "@rnoh/react-native-openharmony/ts";
import type {
  TurboModule,
  TurboModuleContext,
} from "@rnoh/react-native-openharmony/ts";
import { TM } from "@rnoh/react-native-openharmony/generated/ts";
import { RNPackageContext } from "@rnoh/react-native-openharmony/src/main/ets/RNOH/RNPackage";
import { XRNDebugToolsModule } from './XRNDebugToolsModule';

class XRNDebugToolsModulesFactory extends TurboModulesFactory {

  bundleName: string

  constructor(ctx: TurboModuleContext, bundleName: string) {
    super(ctx)
    this.bundleName = bundleName;
  }

  createTurboModule(name: string): TurboModule | null {
    if (this.hasTurboModule(name)) {
      return new XRNDebugToolsModule(this.ctx, this.bundleName);
    }
    return null;
  }

  hasTurboModule(name: string): boolean {
    return name === TM.XRNDebugToolsModule.NAME;
  }
}

export class XRNDebugToolsPackage extends RNPackage {
  bundleName: string

  constructor(ctx: RNPackageContext, bundleName: string) {
    super(ctx);
    this.bundleName = bundleName;
  }

  createTurboModulesFactory(ctx: TurboModuleContext): TurboModulesFactory {
    return new XRNDebugToolsModulesFactory(ctx, this.bundleName);
  }
}
