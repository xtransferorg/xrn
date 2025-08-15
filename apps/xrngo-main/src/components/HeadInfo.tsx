import React from 'react';
import {StyleSheet, Text, View, Image} from 'react-native';

export default function HeadInfo() {
  return (
    <View style={styles.container}>
      <Image
        source={require('../../images/logo.png')}
        style={styles.image}
        width={100}
        height={100}
      />
      <Text style={styles.title}>XRN GO</Text>
      <Text style={styles.description}>
        这是一个 Demo 演示 App，提供相关 API 和组件的功能和用法。
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  image: {
    width: 100,
    height: 100,
    marginBottom: 10,
    borderRadius: 10,
  },
});
