import React from 'react';
import {Alert} from 'react-native';
import {useNavigation} from '@xrnjs/core';

const RouterLifecycleEventsScreen = () => {
  const navigation = useNavigation();

  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      Alert.alert('页面获取焦点');
    });

    return unsubscribe;
  }, [navigation]);

  React.useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      Alert.alert('页面失去焦点');
    });

    return unsubscribe;
  }, [navigation]);

  return <></>;
};

export default RouterLifecycleEventsScreen;
