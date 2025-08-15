import React, {useEffect, useState} from 'react';
import {goBack, useFocusEffect, useNavigation} from '@xrnjs/core';
import Button from '../../components/Button';
import {Page} from '../../components/Page';
import HeadingText from '../../components/HeadingText';
import {
  ScrollView,
  View,
  Text,
  Image,
  I18nManager,
  TouchableOpacity,
} from 'react-native';

const RouterMovingBetweenScreens = () => {
  const navigation = useNavigation();
  const [routes, setRoutes] = useState('');

  useFocusEffect(() => {
    setRoutes(JSON.stringify(navigation.getState().routes, null, 2));
  });

  /* useEffect(() => {
    navigation.setOptions({
      headerLeft: () => {
        return (
          <TouchableOpacity
            accessibilityLabel="headerLeft"
            style={{
              height: 48,
              width: 48,
              padding: 12,
            }}
            onPress={async () => {
              navigation.goBack();
            }}>
            <Image
              style={{
                height: 24,
                width: 24,
                resizeMode: 'contain',
                transform: [{scaleX: I18nManager.isRTL ? -1 : 1}],
              }}
              source={require('../../assets/back-icon.png')}
              fadeDuration={0}
            />
          </TouchableOpacity>
        );
      },
    });
  }, []); */

  return (
    <Page style={{flex: 1}}>
      <View style={{gap: 12}}>
        <Button
          title="navigation.navigate"
          onPress={() => navigation.navigate('router-moving')}
          buttonStyle={{width: '100%'}}
        />
        <Button
          title="navigation.push"
          onPress={() => navigation.push('router-moving')}
          buttonStyle={{width: '100%'}}
        />
        <Button
          title="navigation.replace"
          onPress={() => navigation.replace('router-moving')}
          buttonStyle={{width: '100%'}}
        />
        <Button
          title="navigation.goBack"
          onPress={() => navigation.goBack()}
          buttonStyle={{width: '100%'}}
        />
      </View>
      <HeadingText>当前路由堆栈：</HeadingText>
      <View
        style={{
          height: 320,
          borderWidth: 1,
          padding: 4,
        }}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={{fontSize: 10, color: '#666'}}>{routes}</Text>
        </ScrollView>
      </View>
    </Page>
  );
};

export default RouterMovingBetweenScreens;
