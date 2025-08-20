import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {createStackNavigator} from '@react-navigation/stack';
import * as React from 'react';

import getStackConfig from './StackConfig';
import TabIcon from '../components/TabIcon';
import AboutScreen from '../screens/AboutScreen';
const Stack = createStackNavigator();

function AboutStackNavigator(props: {
  navigation: BottomTabNavigationProp<any>;
}) {
  return (
    <Stack.Navigator {...props} {...getStackConfig()}>
      <Stack.Screen
        name="about-center"
        options={{
          title: '关于',
        }}
        component={AboutScreen}
      />
    </Stack.Navigator>
  );
}

const icon = ({focused}: {focused: boolean}) => {
  return <TabIcon name="about" focused={focused} />;
};
AboutStackNavigator.navigationOptions = {
  title: '关于',
  // tabBarLabel: 'Components',
  tabBarIcon: icon,
  // drawerIcon: icon,
};
export default AboutStackNavigator;
