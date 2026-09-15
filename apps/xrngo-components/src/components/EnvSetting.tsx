import React from 'react';
import {NativeModules} from 'react-native';
import {DebugPanelRouters} from '@xrnjs/devtools';
import {NavigationContainerWrapper} from '@xrnjs/navigation';

export default function App() {
  NativeModules.XRNLoadingModule?.hideLoading?.();
  return <NavigationContainerWrapper routes={DebugPanelRouters} />;
}
