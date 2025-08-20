import {StackRouteConfig} from '@xrnjs/core';
import TxDetail from './src/screens/RouterV2/tx/TxDetail';
import TxDetailUpdate from './src/screens/RouterV2/tx/TxDetailUpdate';
import FormOneStepScreen from './src/screens/RouterV2/DevelopmentScenarios/FormBackToEntryScreen/FormOneStepScreen';
import FormSecondStepScreen from './src/screens/RouterV2/DevelopmentScenarios/FormBackToEntryScreen/FormSecondStepScreen';
import FormSuccess from './src/screens/RouterV2/DevelopmentScenarios/FormBackToEntryScreen/FormSuccess';
import BareHomeScreen from './src/screens/BareHomeScreen';
import XrnNavigationV1Screen from './src/screens/XrnNavigationScreenV1';
import EventPushAllScreen from './src/screens/EventBus/EventPushAllScreen';
import RouterMovingBetweenScreens from './src/screens/RouterV2/RouterMovingBetweenScreens';
import {
  AnimatingDetailScreen,
  AnimatingHomeScreen,
} from './src/screens/RouterV2/RouterAnimating';

export type RouterParamList = {
  TxDetail: {toNext?: boolean} & {
    id: string;
    createAt: string;
    remark?: string;
  };
  CreateFormOneStep: {from: string};
  CreateFormSecondStep: {from: string; name: string};
  FormSuccess: {from: string};
};

export const MainRoutes: StackRouteConfig[] = [
  {
    path: 'BareHome',
    component: BareHomeScreen,
  },
  {
    path: 'NavigationV1',
    component: XrnNavigationV1Screen,
  },
  {
    path: 'router-moving',
    component: RouterMovingBetweenScreens,
    navigationOptions: {
      title: '页面跳转',
    },
  },
  {
    path: 'TxDetail',
    component: TxDetail,
    navigationOptions: {
      title: '详情',
    },
  },
  {
    path: 'TxDetailWithAuth',
    component: TxDetail,
  },
  {
    path: 'TxDetailUpdate',
    component: TxDetailUpdate,
    navigationOptions: {
      title: '更新',
    },
  },
  {
    path: 'scenario-form-back-to-entry',
    component: FormOneStepScreen,
    navigationOptions: {
      headerTitle: '填写基础信息',
    },
  },
  {
    path: 'scenario-form-back-to-entry-2',
    component: FormSecondStepScreen,
    navigationOptions: {
      headerTitle: '填写更多信息',
    },
  },
  {
    path: 'FormSuccess',
    component: FormSuccess,
    navigationOptions: {
      headerTitle: '提交成功',
    },
  },
  {
    path: 'router-animating-home',
    component: AnimatingHomeScreen,
    navigationOptions: {
      headerTitle: '图片列表',
    },
  },
  {
    path: 'router-animating-detail',
    component: AnimatingDetailScreen,
    navigationOptions: {
      headerTitle: '图片详情',
    },
  },
  {
    path: 'event-push-all',
    component: EventPushAllScreen,
    navigationOptions: {
      headerTitle: 'pushAllEvent',
    },
  },
];
