import type {InitBundleConfigProps} from '@xrnjs/core';
import {name as appName} from './app.json';

export default {
  appName,
  mainBundle: false,
  registerComponents: [
    {
      appKey: appName,
      getAppComponent: () => require('./router').module,
    },
  ],
} as InitBundleConfigProps;
