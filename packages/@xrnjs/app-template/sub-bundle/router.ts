import App from './App';
import { initModule, Navigation } from '@xrnjs/core';

export enum ROUTES {
  Demo = 'demo',
}

// Navigation.navigationOptions.setNavigatorScreenOptions({
//   header: () => null
// })

export const routers = [
  {
    path: ROUTES.Demo,
    component: App,
  },
];
export const module = initModule({ routers })
