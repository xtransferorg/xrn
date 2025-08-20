import { RNPackage, TurboModulesFactory, } from "@rnoh/react-native-openharmony/ts";
import type { TurboModule, TurboModuleContext, } from "@rnoh/react-native-openharmony/ts";
import { TM } from "@rnoh/react-native-openharmony/generated/ts";
import { XRNNavigationModule } from './XRNNavigationModule';
import { BundleNavigationModule } from "./BundleNavigationModule";

class XRNNavigationModulesFactory extends TurboModulesFactory {
  createTurboModule(name: string): TurboModule | null {
    if (name === TM.XRNNavigation.NAME) {
      return new XRNNavigationModule(this.ctx);
    }
    if (name === TM.BundleNavigation.NAME) {
      return new BundleNavigationModule(this.ctx);
    }
    return null;
  }

  hasTurboModule(name: string): boolean {
    return name === TM.XRNNavigation.NAME || name === TM.BundleNavigation.NAME;
  }
}

export class XRNNavigationPackage extends RNPackage {
  createTurboModulesFactory(ctx: TurboModuleContext): TurboModulesFactory {
    return new XRNNavigationModulesFactory(ctx);
  }
}
