import React, {useEffect} from 'react';

import {Text, StyleSheet, View} from 'react-native';
// import {checkRNUpdate} from './codepush';

const styles = StyleSheet.create({
  container: {
    flex: 1, // 填充整个屏幕
    justifyContent: 'center', // 垂直居中
    alignItems: 'center', // 水平居中
    backgroundColor: '#f0f0f0', // 背景颜色
  },
});

export default function App() {
  // useEffect(() => {
  //   checkRNUpdate();
  // }, []);
  return (
    <View style={styles.container}>
      <Text>bundle-2</Text>
    </View>
  );
}
