import React from 'react';
import {Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {StackRouteConfig} from '@xrnjs/core';

// import {TabNavigator} from './src/navigation/MainNavigator';
import {DetailItem} from './src/mock';
import App, {Sub} from './App';

export type RouterParamList = {
  TxDetail: DetailItem;
  CreateSuccess: {id: string; created: boolean};
};

const Header = () => {
  const insets = useSafeAreaInsets();
  return <View style={{height: insets.top, backgroundColor: 'white'}} />;
};

export const MainRoutes: StackRouteConfig[] = [
  {
    path: 'Main',
    component: App,
    navigationOptions: {
      header: () => <Header />,
    },
  },
  {
    path: 'Sub',
    component: Sub,
    navigationOptions: {
      header: () => <Header />,
    },
  },
];
