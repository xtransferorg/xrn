import React from 'react';
import {Page} from '../../components/Page';
import Button from '../../components/Button';

import Animated, {SharedTransition, withSpring} from 'react-native-reanimated';
import {useNavigation} from '@xrnjs/core';

const customTransition = SharedTransition.custom(values => {
  'worklet';
  return {
    height: withSpring(values.targetHeight),
    width: withSpring(values.targetWidth),
    originX: withSpring(values.targetOriginX),
    originY: withSpring(values.targetOriginY),
  };
});

export const AnimatingHomeScreen = () => {
  const navigation = useNavigation();

  return (
    <Page>
      <Button
        title="Go to Details"
        onPress={() => navigation.navigate('router-animating-detail')}
      />
      <Animated.Image
        source={{uri: 'https://picsum.photos/id/39/200'}}
        style={{width: 100, height: 100}}
        sharedTransitionTag="PhotoListTag"
        sharedTransitionStyle={customTransition}
      />
    </Page>
  );
};

export const AnimatingDetailScreen = () => {
  const navigation = useNavigation();

  return (
    <Page>
      <Button title="Go back" onPress={() => navigation.goBack()} />
      <Animated.Image
        source={{uri: 'https://picsum.photos/id/39/200'}}
        style={{width: 300, height: 300}}
        sharedTransitionTag="PhotoListTag"
      />
    </Page>
  );
};
