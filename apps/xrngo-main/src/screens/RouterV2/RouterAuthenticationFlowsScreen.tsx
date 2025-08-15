import React from 'react';
import {useNavigation} from '@xrnjs/core';
import Button from '../../components/Button';
import {Page} from '../../components/Page';
import {uniqueId} from 'lodash';
import {ToastAndroid, View} from 'react-native';
import {AuthState} from '../../..';

const detail = {
  id: Math.random().toString(36),
  remark: `我的第${uniqueId()}笔交易`,
};

const RouterAuthenticationFlowsScreen = () => {
  const navigation = useNavigation();

  return (
    <Page>
      <Button
        title="Navigate to Detail with authentication"
        onPress={() =>
          navigation.navigate('router/TxDetailWithAuth', {
            id: detail.id,
          })
        }
      />
      <View style={{height: 12}} />
      <Button
        title="Login"
        onPress={() => {
          AuthState.isAuth = true;
          ToastAndroid.show('Login success', ToastAndroid.SHORT);
        }}
      />
      <View style={{height: 12}} />
      <Button
        title="Logout"
        onPress={() => {
          AuthState.isAuth = false;
          ToastAndroid.show('Logout success', ToastAndroid.SHORT);
        }}
      />
    </Page>
  );
};

export default RouterAuthenticationFlowsScreen;
