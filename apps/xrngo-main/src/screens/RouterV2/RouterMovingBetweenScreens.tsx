import React from 'react';
import {useNavigation} from '@xrnjs/core';
// import Button from '../../components/Button';
import {Button} from '@xrnjs/ui';
import {Page} from '../../components/Page';
import {mockDetail} from '../../mock';

const detail = mockDetail();

const RouterMovingBetweenScreens = () => {
  const navigation = useNavigation();

  return (
    <Page style={{gap: 12}}>
      <Button
        // title="navigation.navigate"
        onPress={() =>
          navigation.navigate('/xrngo-bare/xrngo-bare/TxDetail', detail)
        }
        // buttonStyle={{width: '100%'}}
      >
        navigation.navigate
      </Button>
      <Button
        // title="navigation.push"
        onPress={() =>
          navigation.push('/xrngo-bare/xrngo-bare/TxDetail', detail)
        }
        // buttonStyle={{width: '100%'}}
      >
        navigation.push
      </Button>
      <Button
        // title="navigation.replace"
        onPress={() =>
          navigation.replace('/xrngo-bare/xrngo-bare/TxDetail', detail)
        }
        // buttonStyle={{width: '100%'}}
      >
        navigation.replace
      </Button>
    </Page>
  );
};

export default RouterMovingBetweenScreens;
