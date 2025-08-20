import {RouterScreens} from '../screens/RouterV2/RouterScreen';
import {ScreenConfig} from '../types/ScreenConfig';
import {optionalRequire} from './routeBuilder';
import {Screens} from './Screens';
import {XRNGoDemoModule} from '../mock/XrnDemo';

const ExtraListScreens: ScreenConfig[] = [
  {
    getComponent() {
      return optionalRequire(() => require('../screens/XrnCodePush'));
    },
    name: 'XrnCodePush',
    showName: '热更新',
    description: '热更新功能',
    group: '基础功能',
    packageName: 'xrn-code-push',
    options: {
      title: '热更新',
    },
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/XrnMultiBundleScreen'));
    },
    name: 'XrnMultiBundle',
    options: {
      title: '多 Bundle 管理',
    },
    showName: '多 Bundle 管理',
    description: '支持多 Bundle 加载与管理，优化应用资源使用',
    group: '资源管理',
    packageName: 'xrn-multi-bundle',
    sdkPath: 'undefined',
    onClick: () => {
      return XRNGoDemoModule.jumpMultiBundleDemo();
    },
  },
];

export const MergedScreens = [
  ...Screens,
  ...RouterScreens,
  ...ExtraListScreens,
  {
    getComponent() {
      return optionalRequire(() => require('../screens/WebsiteScreen'));
    },
    name: 'website',
    options: {
      title: ' ',
    },
  },
  {
    getComponent() {
      return optionalRequire(() => require('../screens/DependenciesScreen'));
    },
    name: 'dependencies',
    options: {
      title: '依赖库',
    },
  },
];

export const ListScreens: ScreenConfig[] = [...Screens, ...ExtraListScreens];
