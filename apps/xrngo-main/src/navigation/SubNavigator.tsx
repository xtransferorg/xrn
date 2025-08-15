import {createStackNavigator} from '@react-navigation/stack';
import * as React from 'react';

import {MergedScreens} from './MergedScreens';
import {TouchableOpacity, Text, View, StyleSheet} from 'react-native';
import {useNavToSubPage} from '../utils';
import MemoAPIDocumentIcon from '../components/icons/APIDocumentIcon';

const Stack = createStackNavigator();

export function SubNavigator() {
  const {navToWebsite} = useNavToSubPage();
  return (
    <Stack.Navigator>
      {MergedScreens.map(({name, route, getComponent, options, sdkPath}) => {
        const realName = route || `${name.toLowerCase()}`;

        const headerRight = () => {
          return null;
        };

        return (
          <Stack.Screen
            name={realName}
            key={realName}
            getComponent={getComponent}
            options={
              options
                ? {
                    ...options,
                    headerRight: headerRight,
                  }
                : {
                    headerTitle: name,
                    headerRight: headerRight,
                  }
            }
          />
        );
      })}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  headerRight: {
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
