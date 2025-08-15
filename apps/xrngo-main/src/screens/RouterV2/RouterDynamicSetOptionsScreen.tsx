import React, {useState} from 'react';
import {useNavigation} from '@xrnjs/core';
import Button from '../../components/Button';
import {Page} from '../../components/Page';
import {TextInput, ToastAndroid, TouchableHighlight} from 'react-native';
import HeadingText from '../../components/HeadingText';

const DynamicSetOptionsScreen = () => {
  const navigation = useNavigation();
  const [title, setTitle] = useState('默认标题');

  return (
    <Page style={{gap: 12}}>
      <HeadingText style={{fontSize: 12}}>Title: </HeadingText>
      <TextInput
        value={title}
        onChangeText={setTitle}
        style={{
          height: 32,
          marginVertical: 12,
          borderWidth: 1,
          padding: 4,
        }}
      />
      <Button
        title="设置页面 Title"
        onPress={() => navigation.setOptions({title})}
        buttonStyle={{width: '100%'}}
      />
      <Button
        title="设置顶部左边按钮"
        onPress={() =>
          navigation.setOptions({
            headerLeft: () => {
              return (
                <TouchableHighlight>
                  <Button title="返回" onPress={() => navigation.goBack()} />
                </TouchableHighlight>
              );
            },
          })
        }
        buttonStyle={{width: '100%'}}
      />
      <Button
        title="设置顶部右边按钮"
        onPress={() =>
          navigation.setOptions({
            headerRight: () => {
              return (
                <TouchableHighlight>
                  <Button
                    title="确认"
                    onPress={() => ToastAndroid.show('点击确认', 1000)}
                  />
                </TouchableHighlight>
              );
            },
          })
        }
        buttonStyle={{width: '100%'}}
      />
    </Page>
  );
};

export default DynamicSetOptionsScreen;
