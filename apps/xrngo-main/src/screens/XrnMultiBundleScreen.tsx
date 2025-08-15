import * as React from 'react';
import {StyleSheet, Text, TurboModuleRegistry, View} from 'react-native';

import {Page, Section} from '../components/Page';
import Button from '../components/Button';
import {XRNGODemoModule} from '../mock/XrnDemo';

function jumpMultiBundlePage() {
  XRNGODemoModule?.jumpMultiBundleDemo();
}

export default function XrnMultiBundleScreen() {
  return (
    <Page>
      <View>
        <Text style={styles.desc}>XrnMultiBundle 是纯原生功能</Text>
        <Button
          title="跳转XrnMutliBundlePage"
          onPress={() => {
            jumpMultiBundlePage();
          }}
        />
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  desc: {fontSize: 20, padding: 10},
});

XrnMultiBundleScreen.navigationOptions = {
  title: 'XrnMultiBundle',
};
