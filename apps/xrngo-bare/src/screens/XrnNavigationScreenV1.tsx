import * as React from 'react';

import {Page} from '../components/Page';
import Button from '../components/Button';
import {finishBundle, navigateBundle, replaceBundle} from '@xrnjs/core';
import {View} from 'react-native';

export default function XrnNavigationV1Screen() {
  return (
    <Page>
      <View style={{gap: 16}}>
        <Button
          title="navigateBundle"
          onPress={() => {
            navigateBundle('xrngo-bare');
          }}
          buttonStyle={{width: '100%'}}
        />
        <Button
          title="replaceBundle"
          onPress={() => {
            replaceBundle('xrngo-bare');
          }}
          buttonStyle={{width: '100%'}}
        />
        <Button
          title="finishBundle"
          onPress={() => {
            finishBundle();
          }}
          buttonStyle={{width: '100%'}}
        />
      </View>
    </Page>
  );
}
