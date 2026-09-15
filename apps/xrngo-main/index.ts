/**
 * @format
 */
import './setImmediatePolyfill';
import 'react-native-get-random-values';
import {AppRegistry} from 'react-native';
import {initBundle, initModule} from '@xrnjs/core';
import {MainRoutes} from './Routers';

export const AuthState = {
  isAuth: false,
};

initBundle({
  appName: 'xrngo-main'
})();

AppRegistry.registerComponent('xrngo-main', () =>
  initModule({routers: MainRoutes, autoCheckUpdate: false}),
);
