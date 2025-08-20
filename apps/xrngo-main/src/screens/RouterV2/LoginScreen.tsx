import {View, Text} from 'react-native';
import React from 'react';
import {Page} from '../../components/Page';
import {AuthState} from '../../..';
import Button from '../../components/Button';

const LoginScreen = () => {
  return (
    <Page>
      <Button title="Start Login" onPress={() => (AuthState.isAuth = true)} />
    </Page>
  );
};

export default LoginScreen;
