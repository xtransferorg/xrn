import React from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import packageJson from '../../package.json';
import JSONTree from 'react-native-json-tree';
import {Card, Space} from '@xrnjs/ui';

const theme = {
  tree: {marginLeft: 10},
  valueText: {flexWrap: 'wrap', width: 200},
  label: {flexWrap: 'wrap', width: 200},
};

export default function DependenciesScreen() {
  return (
    <ScrollView style={styles.container}>
      <Space>
        <Card title="Dependencies">
          <JSONTree hideRoot data={packageJson.dependencies} />
        </Card>
        <Card title="Dev Dependencies">
          <JSONTree hideRoot data={packageJson.devDependencies} />
        </Card>
      </Space>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {},
});
