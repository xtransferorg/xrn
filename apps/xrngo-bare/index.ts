import {AppRegistry} from 'react-native';

import {initBundle, initModule} from '@xrnjs/core';
import {MainRoutes} from './Routers';

/* initMonitor({
  appName: 'xt-app-main',
  needDebug: true,
  dsn: 'https://6bda3d5aa9fed13a01a3d9c4ac7326b5@femonitorapi.xtransfer.com/135',
}); */

initBundle({})();

AppRegistry.registerComponent('xrngo-bare', () =>
  initModule({routers: MainRoutes, autoCheckUpdate: false}),
);
