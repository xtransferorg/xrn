import {TextInput} from 'react-native';
import React, {useState} from 'react';
import {Page} from '../../../components/Page';
import {useRoute, RouteProp, useNavigation} from '@xrnjs/core';
import {RouterParamList} from '../../../../Routers';
import HeadingText from '../../../components/HeadingText';
import MonoText from '../../../components/MonoText';
import Button from '../../../components/Button';

const TxDetailUpdate = () => {
  const navigation = useNavigation();
  const {params} = useRoute<RouteProp<RouterParamList, 'TxDetail'>>();

  const [remark, setRemark] = useState<string>();

  return (
    <Page>
      <HeadingText>详情：</HeadingText>
      <MonoText>{JSON.stringify(params, null, 2)}</MonoText>
      <HeadingText style={{fontSize: 14}}>新的备注：</HeadingText>
      <TextInput
        defaultValue={params.remark}
        value={remark}
        onChangeText={setRemark}
        style={{
          height: 32,
          marginVertical: 12,
          borderWidth: 1,
          padding: 4,
        }}
      />
      <Button
        title="确定"
        onPress={() => {
          navigation.navigate('/xrngo-main/xrngo-main/Sub', {
            screen: 'router/passing-parameters',
            params: {...params, remark},
          });
        }}
        buttonStyle={{width: '100%'}}
      />
    </Page>
  );
};

export default TxDetailUpdate;
