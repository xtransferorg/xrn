/* eslint-disable react/react-in-jsx-scope */
import {Platform, View} from 'react-native';
import {ScrollView} from 'react-native-gesture-handler';
import Icon from 'root/Icon/__fixtures__/preview';
import Color from 'root/Icon/__fixtures__/color';
import {Title} from '@xrnjs/ui';

export default () => {
  // @ts-ignore
  const Comp = Platform.OS === 'harmony' ? View : ScrollView;
  return (
    <Comp style={{flex: 1, padding: 16}}>
      <Title>所有图标</Title>
      <View style={{height: 400}}>
        <Icon NUM_COLUMNS={2} />
      </View>
      <Title style={{marginTop: 40}}>改变颜色</Title>
      <View style={{marginTop: 20}}>
        <Color />
      </View>
    </Comp>
  );
};
