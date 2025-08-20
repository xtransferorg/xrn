import React from 'react';
import {StyleSheet, View} from 'react-native';
import {WebView} from 'react-native-webview';
import {useRoute} from '@xrnjs/core';

export default function WebsiteScreen() {
  const route = useRoute();
  return (
    <View style={styles.container}>
      <WebView source={{uri: (route.params as any).url}} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
