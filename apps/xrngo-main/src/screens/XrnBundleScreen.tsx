import * as React from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';

import {ScrollPage} from '../components/Page';
import {NativeFuncCallResult} from '../components/NativeFuncCallResult';
import {XRNBundle} from '@xrnjs/core';

export default function XrnBundleScreen() {
  const [curBundleInfoResult, setCurBundleInfoResult] = React.useState('');
  const [bundleInfoResult, setBundleInfoResult] = React.useState('');
  const [allBundleInfoResult, setAllBundleInfoResult] = React.useState('');
  return (
    <ScrollPage>
      {/* <ScrollView style={styles.scrollContainer}> */}
      <Text style={styles.title}>Bundle信息</Text>

      <View style={styles.section}>
        <NativeFuncCallResult
          funcDes="getCurBundleInfo()：获取当前Bundle信息"
          needParams={false}
          onInvoke={(params: string[]) => {
            XRNBundle.getCurBundleInfo().then(result => {
              setCurBundleInfoResult(JSON.stringify(result));
            });
          }}
          showResult={true}
          result={curBundleInfoResult}
          onReset={function () {
            setCurBundleInfoResult('');
          }}
        />
        <NativeFuncCallResult
          funcDes="getBundleInfo:(bundleName: string)：获取指定Bundle信息"
          needParams={true}
          onInvoke={(params: string[]) => {
            XRNBundle.getBundleInfo(params[0]).then(result => {
              setBundleInfoResult(JSON.stringify(result));
            });
          }}
          showResult={true}
          result={bundleInfoResult}
          onReset={function () {
            setBundleInfoResult('');
          }}
        />
        <NativeFuncCallResult
          funcDes="getAllBundleInfos:()：获取所有Bundle信息"
          needParams={false}
          onInvoke={(params: string[]) => {
            XRNBundle.getAllBundleInfos().then(result => {
              setAllBundleInfoResult(JSON.stringify(result));
            });
          }}
          showResult={true}
          result={allBundleInfoResult}
          onReset={function () {
            setAllBundleInfoResult('');
          }}
        />
      </View>
      <Text style={styles.title}>Bundle加载</Text>

      <View style={styles.section}>
        <NativeFuncCallResult
          funcDes="preLoadBundle(bundleName: string)：预加载指定Bundle"
          needParams={true}
          onInvoke={(params: string[]) => {
            XRNBundle.preLoadBundle(params[0]);
          }}
          showResult={false}
          result={''}
          onReset={() => {}}
        />
        <NativeFuncCallResult
          funcDes="reloadBundle()：Reload当前Bundle"
          needParams={false}
          onInvoke={(params: string[]) => {
            XRNBundle.reloadBundle();
          }}
          showResult={false}
          result={''}
          onReset={() => {}}
        />
      </View>

      <Text style={styles.space} />
      {/* </ScrollView> */}
    </ScrollPage>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    gap: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginLeft: 5,
    marginTop: 20,
    marginBottom: 10,
  },
  section: {
    gap: 10,
  },
  space: {
    width: '100%',
    height: 20,
  },
});

XrnBundleScreen.navigationOptions = {
  title: 'XrnBundle',
};
