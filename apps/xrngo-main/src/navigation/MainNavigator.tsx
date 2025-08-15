import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createStackNavigator} from '@react-navigation/stack';
import React from 'react';

import Colors from '../constants/Colors';

const Tab = createBottomTabNavigator();

import APIStackNavigator from './APIStackNavigator';
import HomeStackNavigator from './HomeStackNavigator';
import WidgetStackNavigator from './XtdStackNavigator';
import AboutStackNavigator from './AboutStackNavigator';

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.activeTintColor,
        tabBarInactiveTintColor: Colors.inactiveTintColor,
      }}
      safeAreaInsets={{
        top: 5,
      }}>
      <Tab.Screen
        name={'home'}
        component={HomeStackNavigator}
        options={HomeStackNavigator.navigationOptions}
      />

      <Tab.Screen
        name={'components'}
        component={WidgetStackNavigator}
        options={WidgetStackNavigator.navigationOptions}
      />

      <Tab.Screen
        name={'api'}
        component={APIStackNavigator}
        options={APIStackNavigator.navigationOptions}
      />

      <Tab.Screen
        name={'about'}
        component={AboutStackNavigator}
        options={AboutStackNavigator.navigationOptions}
      />
    </Tab.Navigator>
  );
}

/* export default () => {
  return (
    <NavigationContainer>
      <Switch.Navigator
        screenOptions={{headerShown: false}}
        initialRouteName="main">
        <Switch.Screen name="main" component={TabNavigator} />
      </Switch.Navigator>
    </NavigationContainer>
  );
}; */
