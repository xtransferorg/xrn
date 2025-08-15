// import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React from 'react';
import {Platform, Text} from 'react-native';
import {Colors} from '../constants';
// import MemoComponentsIcon from './icons/ComponentsIcon';

// import {Colors} from '../constants';

type Props = {
  name: 'components' | 'home';
  focused?: boolean;
  size?: number;
};

const TabIcon = ({size = 27, name, focused}: Props) => {
  // return null;
  const color = focused ? Colors.tabIconSelected : Colors.tabIconDefault;
  const platformSize = Platform.select({
    ios: size,
    default: size - 2,
  });
  switch (name) {
    case 'home':
      return <Text style={{color}}>🏠</Text>;
    case 'components':
      // return <MemoComponentsIcon />;
    return <Text style={{color}}>🛠</Text>;
    default:
      return null;
  }
  // return <MaterialCommunityIcons name={name as any} size={platformSize} color={color} />;
};

export default TabIcon;
