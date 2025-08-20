import {Text} from 'react-native';
import React from 'react';
import {Page} from '../../../../components/Page';
import Button from '../../../../components/Button';
import {RouteProp, useNavigation, useRoute} from '@xrnjs/core';
import {RouterParamList} from '../../../../../Routers';
import {uniqueId} from 'lodash';

const FormSuccess = () => {
  const navigation = useNavigation();
  const {params} = useRoute<RouteProp<RouterParamList, 'FormSuccess'>>();

  return (
    <Page>
      <Text>Create success!!!</Text>
      <Button
        title="回到入口页"
        onPress={() => {
          navigation.navigate('/xrngo-main/xrngo-main/Sub', {
            screen: params.from,
            params: {created: true, id: uniqueId()},
          });
        }}
      />
    </Page>
  );
};

export default FormSuccess;
