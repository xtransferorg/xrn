import * as React from 'react';
import {ScrollView, StyleSheet, View, Text} from 'react-native';

import {Page, Section} from '../components/Page';
import {NativeFuncCallResult} from '../components/NativeFuncCallResult';
import {XRNAppUtils} from '@xrnjs/core';

export default function XrnAppUtilsScreen() {
  const [isRootResult, setRootResult] = React.useState('未调用');

  const [isAppInstallResult, setAppInstallResult] = React.useState('未调用');
  return (
    <Page>
      <ScrollView style={sytles.scrollView}>
        <View style={sytles.scrollView}>
          <NativeFuncCallResult
            funcDes={'isAppRooted()'}
            specialDesc="目前鸿蒙不支持，需要开通Device Security服务"
            needParams={false}
            onReset={function (): void {
              setRootResult('未调用');
            }}
            onInvoke={function (params: string[]): void {
              console.log(XRNAppUtils);
              XRNAppUtils.isAppRooted()
                .then(value => {
                  setRootResult(value ? '已Root' : '未Root');
                })
                .catch((err: any) => {
                  console.log(`error=${err}`);
                  setRootResult(`error=${JSON.stringify(err)}`);
                });
            }}
            showResult={true}
            result={isRootResult}
          />
          <NativeFuncCallResult
            funcDes={'installApp: (filePath: string)'}
            needParams={true}
            onReset={function (): void {}}
            onInvoke={function (params: string[]): void {
              XRNAppUtils.installApp(params[0]);
            }}
            showResult={false}
            result={''}
          />
          <NativeFuncCallResult
            funcDes={'isAppInstalled: (pkgName: string)'}
            specialDesc="鸿蒙平台参数类似alipays://,可支持查询的App需要在项目中配置，xrngo目前配置了 alipays amapuri zhihu"
            needParams={true}
            onReset={function (): void {
              setAppInstallResult('未调用');
            }}
            onInvoke={function (params: string[]): void {
              const result = XRNAppUtils.isAppInstalled(params[0]);
              setAppInstallResult(result ? '已安装' : '未安装');
            }}
            showResult={true}
            result={isAppInstallResult}
          />
          <NativeFuncCallResult
            funcDes={'exitApp: ()'}
            needParams={false}
            onReset={function (): void {}}
            onInvoke={function (params: string[]): void {
              XRNAppUtils.exitApp();
            }}
            showResult={false}
            result={''}
          />
          <NativeFuncCallResult
            funcDes={'relaunchApp: ()'}
            needParams={false}
            onReset={function (): void {}}
            onInvoke={function (params: string[]): void {
              XRNAppUtils.relaunchApp();
            }}
            showResult={false}
            result={''}
          />
          <NativeFuncCallResult
            funcDes={'moveTaskToBack: ()'}
            needParams={false}
            onReset={function (): void {}}
            onInvoke={function (params: string[]): void {
              XRNAppUtils.moveTaskToBack();
            }}
            showResult={false}
            result={''}
          />
          <NativeFuncCallResult
            funcDes={
              'launchAppDetail(appPkgName: string, marketPkgName: string)'
            }
            specialDesc="鸿蒙平台，appPkgName是AppId，Android平台是包名"
            needParams={true}
            onReset={function (): void {}}
            onInvoke={function (params: string[]): void {
              XRNAppUtils.launchAppDetail(params[0], params[1]);
            }}
            showResult={false}
            result={''}
          />
          <Text style={sytles.space} />
        </View>
      </ScrollView>
    </Page>
  );
}

const sytles = StyleSheet.create({
  scrollView: {
    gap: 10,
    paddingTop: 10,
  },
  space: {
    width: '100%',
    height: 200,
    fontSize: 20,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
});

XrnAppUtilsScreen.navigationOptions = {
  title: 'XrnAppUtils',
};
