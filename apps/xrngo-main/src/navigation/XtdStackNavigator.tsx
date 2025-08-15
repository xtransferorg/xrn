import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {createStackNavigator} from '@react-navigation/stack';
import * as React from 'react';

import getStackConfig from './StackConfig';
import TabIcon from '../components/TabIcon';
import WidgetScreen from '../screens/WidgetScreen';

const Stack = createStackNavigator();

function WidgetStackNavigator(props: {
  navigation: BottomTabNavigationProp<any>;
}) {
  return (
    <Stack.Navigator {...props} {...getStackConfig()}>
      <Stack.Screen
        name="组件库"
        options={{
          title: '组件库',
        }}
        component={WidgetScreen}
      />
    </Stack.Navigator>
  );
}

const icon = ({focused}: {focused: boolean}) => {
  return <TabIcon name="components" focused={focused} />;
};
WidgetStackNavigator.navigationOptions = {
  title: '组件库',
  // tabBarLabel: 'Components',
  tabBarIcon: icon,
  // drawerIcon: icon,
};
export default WidgetStackNavigator;
