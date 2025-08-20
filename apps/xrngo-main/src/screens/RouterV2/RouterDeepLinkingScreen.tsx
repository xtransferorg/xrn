import {View, Text, Linking} from 'react-native';
import React from 'react';
import {Page} from '../../components/Page';
import Button from '../../components/Button';

const RouterDeepLinkingScreen = () => {
  return (
    <Page>
      <Button
        title="Open Deep Link"
        onPress={() => {
          Linking.openURL(
            'xtransfer://xtransfer/v1/xrngo-bare/xrngo-bare/TxDetail?id=123&remark=Hello',
          );
        }}
      />
    </Page>
  );
};

export default RouterDeepLinkingScreen;
