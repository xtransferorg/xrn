// 不要修改这个文件，这个文件是由 generateScreens.js 自动生成的
import {ScreenConfig} from '../types/ScreenConfig';
import {optionalRequire} from './routeBuilder';

export const Screens: ScreenConfig[] = [
  {
    getComponent() {
      return optionalRequire(() => require('../screens/XrnBundleScreen'));
    },
    name: 'XrnBundle',
    options: {
      title: 'Bundle 管理',
    },
    showName: 'Bundle 管理',
    description: '提供 Bundle 资源加载和版本管理功能',
    group: '资源管理',
    packageName: 'xrn-bundle',
    sdkPath: 'resource-management/xrn-bundle',
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/XrnNavigationScreen'));
    },
    name: 'XrnNavigation',
    options: {
      title: '导航',
    },
    showName: '导航',
    description: '提供应用内导航管理，支持多种路由方式',
    group: '路由与导航',
    packageName: 'xrn-navigation',
    sdkPath: 'routing-navigation/xrn-navigation',
  },
];
