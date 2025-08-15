import {View, Text} from 'react-native';
import React from 'react';
import {Page} from '../../../components/Page';
import Button from '../../../components/Button';
import {useNavigation} from '@xrnjs/core';

const CreateEntryScreen = () => {
  const navigation = useNavigation();

  return (
    <Page>
      <Button
        title="Create"
        onPress={() => {
          navigation.navigate(
            '/xrngo-bare/xrngo-bare/scenario-form-back-to-entry',
            {
              from: '/xrngo/xrngo/router/common-development-scenarios',
            },
          );
        }}
        buttonStyle={{width: '100%'}}
      />
    </Page>
  );
};

export default CreateEntryScreen;
