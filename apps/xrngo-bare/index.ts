import 'react-native-get-random-values';

import {AppRegistry} from 'react-native';

import {initBundle, initModule} from '@xrnjs/core';
import {MainRoutes} from './Routers';

initBundle({})();

AppRegistry.registerComponent('xrngo-bare', () =>
  initModule({routers: MainRoutes, autoCheckUpdate: false}),
);
