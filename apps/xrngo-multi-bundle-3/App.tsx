import React, {useEffect} from 'react';

import {Text, View, StyleSheet, Image} from 'react-native';
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
      <Text>Bundle-3</Text>
      <Image
        source={require('./dog2.png')}
        style={{width: 100, height: 100}}
        width={100}
        height={100}
      />
      <Image
        source={require('./dog3.png')}
        style={{width: 100, height: 100}}
        width={100}
        height={100}
      />
    </View>
  );
}
