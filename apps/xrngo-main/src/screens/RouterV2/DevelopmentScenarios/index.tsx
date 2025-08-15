import React, {useEffect, useMemo} from 'react';
import ComponentListScreen, {ListElement} from '../../ComponentListScreen';
import {useRoute, RouteProp} from '@xrnjs/core';
import {RouterParamList} from '../../../../Routers';
import {Alert} from 'react-native';
import {optionalRequire} from '../../../navigation/routeBuilder';

type Scenario = {
  route: {name: string; params?: object} | string;
  name?: string;
};

export const ScenarioScreens = [
  {
    route: 'router/scenario-back-double-confirm',
    options: {title: '返回双重确认（配合 Page 组件实现）'},
    getComponent() {
      return optionalRequire(() => require('./BackDoubleConfirmScreen'));
    },
  },
];

const Scenarios: Scenario[] = [
  {
    route: {
      name: '/xrngo-bare/xrngo-bare/scenario-form-back-to-entry',
      params: {from: 'router/common-development-scenarios'},
    },
    name: '提交表单成功后携带数据返回到入口页',
  },
  ...ScenarioScreens,
];

const Screen = () => {
  const {params} = useRoute<RouteProp<RouterParamList, 'CreateSuccess'>>();

  useEffect(() => {
    if (params && params.created) {
      Alert.alert('创建成功. ID: ' + params.id);
    }
  }, [params]);

  const items = useMemo(() => {
    return Scenarios.map(item => {
      return {
        name: item.name ?? item.options?.title,
        isAvailable: true,
        route: item.route,
      };
    });
  }, []);
  return <ComponentListScreen apis={items} sort={false} />;
};

export default Screen;
