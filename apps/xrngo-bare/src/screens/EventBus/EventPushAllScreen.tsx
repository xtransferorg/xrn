import React from 'react';
import {Page} from '../../components/Page';
import Button from '../../components/Button';
import {pushAllEvent} from '@xrnjs/core';
import {uniqueId} from 'lodash';

const EventPushAllScreen = () => {
  return (
    <Page>
      <Button
        title="pushAllEvent"
        onPress={() => {
          pushAllEvent('createDetailSuccess', {
            id: uniqueId(),
            createAt: new Date(),
            source: '其他 bundle',
          });
        }}
        buttonStyle={{width: '100%'}}
      />
    </Page>
  );
};

export default EventPushAllScreen;
