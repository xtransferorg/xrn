import React from 'react';
import {RouteProp, useNavigation, useRoute} from '@xrnjs/core';
import {uniqueId} from 'lodash';
import Button from '../../components/Button';
import {Page} from '../../components/Page';
import {RouterParamList} from '../../../Routers';
import MonoText from '../../components/MonoText';
import HeadingText from '../../components/HeadingText';
import {mockDetail} from '../../mock';

const DynamicSetOptionsScreen = () => {
  const route = useRoute<RouteProp<RouterParamList, 'TxDetail'>>();

  const navigation = useNavigation();

  return (
    <Page style={{gap: 12}}>
      <HeadingText>当前页面参数：</HeadingText>
      <MonoText>{JSON.stringify(route.params, null, 2)}</MonoText>
      <Button
        title="navigation.setParams"
        onPress={() => navigation.setParams(mockDetail())}
        buttonStyle={{width: '100%'}}
      />
    </Page>
  );
};

export default DynamicSetOptionsScreen;
