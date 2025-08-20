/**
 * @format
 */

import {AppRegistry} from 'react-native';
import {initBundle, initModule, Navigation} from '@xrnjs/core';
import {MainRoutes} from './Routers';

export const AuthState = {
  isAuth: false,
};

Navigation.interceptor.use(ctx => {
  console.log('Navigation interceptor', ctx.nextRouteName);

  const {nextRouteName} = ctx;

  if (nextRouteName === 'router/TxDetailWithAuth' && !AuthState.isAuth) {
    ctx.navigation.navigate('router/Login');
    return false;
  }
});

initBundle({})();

AppRegistry.registerComponent('xrngo-main', () =>
  initModule({routers: MainRoutes, autoCheckUpdate: false}),
);
