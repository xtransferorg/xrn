import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {createStackNavigator} from '@react-navigation/stack';
import * as React from 'react';

import getStackConfig from './StackConfig';
// import {optionalRequire} from './routeBuilder';
import TabIcon from '../components/TabIcon';
import HomeScreen from '../screens/HomeScreen';

const Stack = createStackNavigator();

function HomeStackNavigator(props: {navigation: BottomTabNavigationProp<any>}) {
  return (
    <Stack.Navigator {...props} {...getStackConfig()}>
      <Stack.Screen
        name="Home"
        options={{
          title: 'XRN GO',
        }}
        component={HomeScreen}
      />
    </Stack.Navigator>
  );
}

const icon = ({focused}: {focused: boolean}) => {
  return <TabIcon name="home" focused={focused} />;
};
HomeStackNavigator.navigationOptions = {
  title: '首页',
  tabBarIcon: icon,
};
export default HomeStackNavigator;
