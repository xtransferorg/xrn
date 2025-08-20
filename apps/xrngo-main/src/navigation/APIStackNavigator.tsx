import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {createStackNavigator} from '@react-navigation/stack';
import * as React from 'react';

import TabIcon from '../components/TabIcon';
import Components from '../screens/ComponentsScreen';
import getStackConfig from './StackConfig';

const Stack = createStackNavigator();

function APIStackNavigator(props: {navigation: BottomTabNavigationProp<any>}) {
  return (
    <Stack.Navigator {...props} {...getStackConfig()}>
      <Stack.Screen
        name="Demos"
        options={{
          title: '接口',
        }}
        component={Components}
      />
    </Stack.Navigator>
  );
}

const icon = ({focused}: {focused: boolean}) => {
  return <TabIcon name="api" focused={focused} />;
};
APIStackNavigator.navigationOptions = {
  title: '接口',
  // tabBarLabel: 'Components',
  tabBarIcon: icon,
  // drawerIcon: icon,
};
export default APIStackNavigator;
