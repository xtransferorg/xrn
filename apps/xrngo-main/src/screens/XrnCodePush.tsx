import React, {useEffect, useState, Component} from 'react';
import {Page, ScrollPage, Section} from '../components/Page';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import CodePush from '@xrnjs/react-native-code-push';
import {useNavigation} from '@xrnjs/core';
// import Button from '../components/Button';
import {checkRNUpdate} from '@xrnjs/core';
import {Space, Button} from '@xrnjs/ui';

function CodePushUpdate() {
  const navigation = useNavigation();
  return (
    // <Page>
    <Space>
      {/* <Section
          title="热更新"
          bodyPadding={{top: 0, bottom: 24, left: 16, right: 16}}>
          <Button
            buttonStyle={{width: '100%'}}
            onPress={() => {
              checkRNUpdate({isMain: false, shouldUpdate: true});
              console.log('触发热更新（当前bundle）');
            }}
            title="触发热更新（当前bundle）"
          />
        </Section> */}
      <Section
        title="静默更新"
        bodyPadding={{top: 0, bottom: 20, left: 16, right: 16}}>
        <Button
          // buttonStyle={{width: '100%'}}
          onPress={() =>
            navigation.navigate('/xrngo-multi-bundle-1/xrngo-multi-bundle-1')
          }
          // title="跳转到静默更新bundle"
        >
          跳转到静默更新bundle
        </Button>
      </Section>
      <Section
        title="强制更新"
        bodyPadding={{top: 0, bottom: 20, left: 16, right: 16}}>
        <Button
          // buttonStyle={{width: '100%'}}
          onPress={() =>
            navigation.navigate('/xrngo-multi-bundle-2/xrngo-multi-bundle-2')
          }>
          跳转到强制更新bundle
        </Button>
      </Section>
      <Section
        title="增量更新"
        bodyPadding={{top: 0, bottom: 20, left: 16, right: 16}}>
        <Button
          // buttonStyle={{width: '100%'}}
          onPress={() =>
            navigation.navigate('/xrngo-multi-bundle-3/xrngo-multi-bundle-3')
          }
          // title="跳转到增量更新bundle"
        >
          跳转到增量更新bundle
        </Button>
      </Section>
    </Space>
  );
}

let codePushOptions = {checkFrequency: CodePush.CheckFrequency.MANUAL};

const ICodePush = CodePush(codePushOptions)(CodePushUpdate);

export default function XrnLoadingScreen() {
  return (
    <Page>
      <ICodePush />
    </Page>
  );
}

XrnLoadingScreen.navigationOptions = {title: 'XrnCodePush'};
