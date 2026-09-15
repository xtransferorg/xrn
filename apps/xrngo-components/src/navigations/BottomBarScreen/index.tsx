import React, {useState} from 'react';
import {View} from 'react-native';
import {BottomBar, BottomBarTabItem, IconMARobot1, IconMAActivity1, IconMAPicture1} from '@xrnjs/ui';

const bottomBarIconStyle = {
  alignSelf: 'center',
  justifyContent: 'center',
  alignItems: 'center',
  // 无论大小图标都保持同一个占用空间
  width: 24,
  height: 24,
};

const bottomBar: BottomBarTabItem[] = [
  {
    value: 1,
    label: '首页',
    iconRender: (color?: string) => (
      <IconMARobot1
        fillColor={color}
        pointerEvents="none"
        size={24}
        style={bottomBarIconStyle}
      />
    ),
  },
  {
    value: 2,
    label: '发现页',
    iconRender: (color?: string) => (
      <IconMAActivity1
        fillColor={color}
        pointerEvents="none"
        size={24}
        style={bottomBarIconStyle}
      />
    ),
  },
  {
    value: 3,
    label: '更多设置',
    iconRender: (color?: string) => (
      <IconMAPicture1
        fillColor={color}
        pointerEvents="none"
        size={24}
        style={bottomBarIconStyle}
      />
    ),
  },
];

const BottomBarScreen = () => {
  const [value1, setValue1] = useState(bottomBar[1].value);
  return (
    <View style={{flex: 1}}>
      <View style={{flex: 1, backgroundColor: 'white'}} />
      <BottomBar
        safeAreaInsetBottom={true}
        options={bottomBar}
        value={value1}
        onChange={v => {
          setValue1(v as number);
        }}
      />
    </View>
  );
};

export default BottomBarScreen;
