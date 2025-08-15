import React, {useEffect, useState} from 'react';
import {View} from 'react-native';
import Button from '../../components/Button';
import {Page} from '../../components/Page';
import {RouteProp, useNavigation, useRoute} from '@xrnjs/core';
import HeadingText from '../../components/HeadingText';
import MonoText from '../../components/MonoText';
import {RouterParamList} from '../../../Routers';
import {DetailItem, mockDetail} from '../../mock';

const RouterPassingParametersScreens = () => {
  const navigation = useNavigation();

  const [detail, setDetail] = useState<DetailItem>(mockDetail());

  const {params} = useRoute<RouteProp<RouterParamList, 'TxDetail'>>();

  useEffect(() => {
    if (params && params.id) {
      setDetail(params);
    }
  }, [params]);

  return (
    <Page>
      <HeadingText>当前详情：</HeadingText>
      <MonoText>{JSON.stringify(detail, null, 2)}</MonoText>
      <View style={{gap: 12}}>
        <Button
          title="生成新的详情"
          onPress={() => {
            setDetail(mockDetail());
          }}
          buttonStyle={{width: '100%'}}
        />
        <Button
          title="跳转详情页查看详细数据"
          onPress={() => {
            navigation.navigate('/xrngo-bare/xrngo-bare/TxDetail', {
              ...detail,
              toNext: false,
            });
          }}
          buttonStyle={{width: '100%'}}
        />
        <Button
          title="跳转编辑页更新数据"
          onPress={() => {
            navigation.navigate(
              '/xrngo-bare/xrngo-bare/TxDetailUpdate',
              detail,
            );
          }}
          buttonStyle={{width: '100%'}}
        />
      </View>
    </Page>
  );
};

export default RouterPassingParametersScreens;
