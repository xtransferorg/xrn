import {TextInput, Alert, View, ToastAndroid} from 'react-native';
import React, {useCallback, useState} from 'react';
import HeadingText from '../../../components/HeadingText';
import Button from '../../../components/Button';
import {Page, useNavigation} from '@xrnjs/core';

const BackDoubleConfirmScreen = () => {
  const navigation = useNavigation();
  const [remark, setRemark] = useState<string>();

  const onBack = useCallback(() => {
    Alert.alert('确定要返回吗？', '返回后将不会保存修改', [
      {
        text: '取消',
        style: 'cancel',
      },
      {
        text: '确定',
        onPress: () => {
          navigation.goBack();
        },
      },
    ]);

    // return true to prevent default back action
    return true;
  }, [navigation]);

  return (
    <Page gestureEnabled={false} title="返回双重确认" onBack={onBack}>
      <View style={{paddingHorizontal: 12}}>
        <HeadingText style={{fontSize: 14}}>备注：</HeadingText>
        <TextInput
          value={remark}
          onChangeText={setRemark}
          style={{
            height: 32,
            marginVertical: 12,
            borderWidth: 1,
            padding: 4,
          }}
        />
        <Button
          title="确认"
          onPress={() => {
            ToastAndroid.show('保存成功', ToastAndroid.SHORT);
            navigation.goBack();
          }}
          buttonStyle={{width: '100%'}}
        />
      </View>
    </Page>
  );
};

export default BackDoubleConfirmScreen;
