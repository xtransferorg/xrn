// import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React from 'react';
import {Platform, StyleSheet, Text, Image} from 'react-native';
// import {LocalSvg} from 'react-native-svg/css';
import {Colors} from '../constants';
import MemoComponentsIcon from './icons/ComponentsIcon';
import MemoHomeIcon from './icons/HomeIcon';
import MemoAPIIcon from './icons/APIIcon';
import MemoAboutIcon from './icons/AboutIcon';

// import {Colors} from '../constants';

const LocalSvg: React.FC<{asset: any}> = ({asset}) => {
  return (
    <Image
      source={asset}
      width={16}
      height={16}
      style={{width: 16, height: 16}}
    />
  );
};

type Props = {
  name: 'components' | 'home' | 'api' | 'about';
  focused?: boolean;
  size?: number;
};

const TabIcon = ({size = 20, name, focused}: Props) => {
  const color = focused ? Colors.tabIconSelected : Colors.tabIconDefault;
  const platformSize = size;
  switch (name) {
    case 'home':
      return <MemoHomeIcon size={platformSize} fillColor={color} />;

    case 'components':
      return <MemoComponentsIcon size={platformSize} fillColor={color} />;

    case 'api':
      return <MemoAPIIcon size={platformSize} fillColor={color} />;

    case 'about':
      return <MemoAboutIcon size={platformSize} fillColor={color} />;
    default:
      return null;
  }
};

const styles = StyleSheet.create({
  icon: {
    fontSize: 16,
  },
});

export default TabIcon;
