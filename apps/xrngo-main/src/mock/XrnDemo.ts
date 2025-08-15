import {NativeModules, TurboModuleRegistry} from 'react-native';

export type XRNGODemoModule = {
  jumpMultiBundleDemo: () => void;
  handleOhCrash(): void;
  handleOhRejectCrash(): void;
};

const XRNGoDemoModule = TurboModuleRegistry
  ? TurboModuleRegistry.get<XRNGODemoModule>('XRNGODemoModule')
  : NativeModules.XRNGODemoModule;

export {XRNGoDemoModule};
