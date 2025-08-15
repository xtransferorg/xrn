import React, {useEffect} from 'react';
import {View, Text, StyleSheet, TextInput, ScrollView} from 'react-native';
import {XRNKeyboard, KeyboardMode, XRNFile} from 'xrn-app-utils';

async function onClickOffset() {
  const result = await XRNKeyboard.setKeyboardAvoidMode('OFFSET');
  console.log('onClickOffset', result);
}

async function onClickResize() {
  const result = await XRNKeyboard.setKeyboardAvoidMode('RESIZE');
  console.log('onClickResize', result);
}

async function onClickClearFresco() {
  const result = await XRNFile.clearFrescoCache();
  console.log('onClickClearFresco', result);
}

export default function AppTest() {
  useEffect(() => {
    // checkRNUpdate();
  }, []);
  return (
    <View style={styles.view}>
      <Text style={styles.text}>HelloWorld</Text>
      <Text
        onPress={() => {
          onClickOffset();
        }}>
        Offset
      </Text>
      <Text
        onPress={() => {
          onClickResize();
        }}>
        Resize
      </Text>
      <Text onPress={() => onClickClearFresco()}>clearFrescoCache</Text>
      <TextInput>Input</TextInput>
      <TextInput>Input</TextInput>
      <TextInput>Input</TextInput>
      <TextInput style={styles.input}>Input</TextInput>
      <Text style={styles.bottom}>Bottom</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  view: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'blue',
  },
  text: {
    // width: '100%',
    // height: '100%',
  },
  input: {
    width: '100%',
    height: 20,
    marginTop: 300,
  },
  bottom: {
    width: '100%',
    height: 200,
    backgroundColor: 'red',
  },
});
