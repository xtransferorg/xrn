import React, {useMemo} from 'react';

import {optionalRequire} from '../../navigation/routeBuilder';
import ComponentListScreen, {ListElement} from '../ComponentListScreen';
import {ScenarioScreens} from './DevelopmentScenarios';

export const RouterApiScreens = [
  {
    route: 'router/passing-parameters',
    options: {title: '页面传参'},
    getComponent() {
      return optionalRequire(() => require('./RouterPassingParametersScreens'));
    },
  },
  {
    route: 'router/lifecycle-events',
    options: {title: '生命周期事件监听'},
    getComponent() {
      return optionalRequire(() => require('./RouterLifecycleEventsScreen'));
    },
  },
  {
    route: 'router/lifecycle-events-hook',
    options: {title: '生命周期事件 hook'},
    getComponent() {
      return optionalRequire(() =>
        require('./RouterLifecycleEventsHookScreen'),
      );
    },
  },
  {
    route: 'router/dynamic-set-params',
    options: {title: '动态设置页面参数'},
    getComponent() {
      return optionalRequire(() => require('./RouterDynamicSetParamsScreen'));
    },
  },
  {
    route: 'router/dynamic-set-options',
    options: {title: '动态设置页面配置'},
    getComponent() {
      return optionalRequire(() => require('./RouterDynamicSetOptionsScreen'));
    },
  },
  /* {
    name: '认证工作流',
    route: 'router/authentication-flows',
    options: {},
    getComponent() {
      return optionalRequire(() =>
        require('./RouterAuthenticationFlowsScreen'),
      );
    },
  }, */
  {
    route: 'router/common-development-scenarios',
    options: {title: '常见开发场景'},
    getComponent() {
      return optionalRequire(() => require('./DevelopmentScenarios/index'));
    },
  },
  // 合并 0228 master 代码后再开启
  /* {
    name: 'Deep linking',
    route: 'router/deep-linking',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./RouterDeepLinkingScreen'));
    },
  }, */
];

const Apis = [
  {
    route: '/xrngo-bare/xrngo-bare/router-moving',
    options: {title: '页面跳转'},
  },
  ...RouterApiScreens,
];

// 元素共享只支持 @react-navigation/native-stack
// https://reactnavigation.org/docs/6.x/shared-element-transitions

// Apis.splice(2, 0, {
//   route: '/xrngo-bare/xrngo-bare/router-animating-home',
//   options: {title: '页面共享元素'},
// });

export const RouterScreens = [
  ...RouterApiScreens,
  ...ScenarioScreens,
  {
    name: 'Login',
    route: 'router/Login',
    options: {},
    getComponent() {
      return optionalRequire(() => require('./LoginScreen'));
    },
  },
];

export default function RouterScreen() {
  const apis: ListElement[] = useMemo(() => {
    return Apis.map(screen => {
      return {
        name: screen.name ?? screen.options?.title,
        isAvailable: true,
        route: `${screen.route}`,
      };
    });
  }, []);
  return <ComponentListScreen apis={apis} sort={false} />;
}
