import React from 'react';

export type ScreenConfig = {
  getComponent(): React.ComponentType<object> | (() => JSX.Element);
  name: string;
  showName?: string;
  description?: string;
  group?: string;
  route?: string;
  options?: object;
  packageName?: string;
  sdkPath?: string;
  onClick?: () => {};
};
