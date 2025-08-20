import React, {useCallback} from 'react';
import {Alert} from 'react-native';
import {useFocusEffect} from '@xrnjs/core';

const RouterLifecycleEventsHookScreen = () => {
  useFocusEffect(
    useCallback(() => {
      Alert.alert('页面获取焦点');

      return () => {
        Alert.alert('页面失去焦点');
      };
    }, []),
  );

  return <></>;
};

export default RouterLifecycleEventsHookScreen;
