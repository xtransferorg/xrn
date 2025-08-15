import React from 'react';
import {View} from 'react-native';
import {RouteProp, useNavigation, useRoute} from '@xrnjs/core';
import {RouterParamList} from '../../../../Routers';
import HeadingText from '../../../components/HeadingText';
import MonoText from '../../../components/MonoText';
import {Page} from '../../../components/Page';
import Button from '../../../components/Button';

const TxDetail = () => {
  const navigation = useNavigation();
  const {params} = useRoute<RouteProp<RouterParamList, 'TxDetail'>>();

  const {toNext = true} = params || {};

  return (
    <Page>
      <HeadingText>详情：</HeadingText>
      <MonoText>{JSON.stringify(params, null, 2)}</MonoText>
      {toNext && (
        <View style={{gap: 12}}>
          <Button
            title="navigation.navigate"
            onPress={() => navigation.navigate('TxDetail', params)}
            buttonStyle={{width: '100%'}}
          />
          <Button
            title="navigation.push"
            onPress={() => navigation.push('TxDetail', params)}
            buttonStyle={{width: '100%'}}
          />
          <Button
            title="navigation.goBack"
            onPress={() => navigation.goBack()}
            buttonStyle={{width: '100%'}}
          />
        </View>
      )}
    </Page>
  );
};

export default TxDetail;
