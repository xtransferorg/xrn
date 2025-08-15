import * as React from 'react';
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {useRef, useState} from 'react';
import {Page, Section} from '../components/Page';
import {XRNNativeStorage} from '@xrnjs/native-storage';
import {NativeFuncCallResult} from '../components/NativeFuncCallResult';
import Toast from 'react-native-simple-toast';

export default function XrnNativeStorageScreen() {
  const {
    getItem,
    setItem,
    removeItem,
    getItemSync,
    setItemSync,
    removeItemSync,
  } = XRNNativeStorage;

  const [asyncSetItem, setAsyncSetItem] = React.useState('');
  const [asyncGetItem, setAsyncGetItem] = React.useState('');
  const [asyncRemoveItem, setAsyncRemoveItem] = React.useState('');

  const [syncSetItem, setSyncSetItem] = React.useState('');
  const [syncGetItem, setSyncGetItem] = React.useState('');
  const [syncRemoveItem, setSyncRemoveItem] = React.useState('');

  return (
    <Page>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={styles.container}>
          <View style={styles.container}>
            <Text style={styles.title}>异步api</Text>
            <NativeFuncCallResult
              funcDes={'setItem(key: string, value: string)'}
              specialDesc="异步设置值"
              needParams={true}
              onReset={function (): void {
                setAsyncSetItem('');
              }}
              onInvoke={async (params: string[]) => {
                if (params.length < 2) {
                  Toast.show('请检查参数是否正确', Toast.CENTER);
                }
                const key = params[0];
                const value = params[1];
                setItem(key, value);
                const result = await getItem(key);
                setAsyncSetItem(result);
              }}
              showResult={true}
              result={asyncSetItem}
            />
            <NativeFuncCallResult
              funcDes={'getItem(key: string)'}
              specialDesc="异步获取值"
              needParams={true}
              onReset={function (): void {
                setAsyncGetItem('');
              }}
              onInvoke={async (params: string[]) => {
                if (params.length < 1) {
                  Toast.show('请检查参数是否正确', Toast.CENTER);
                }
                const key = params[0];
                const result = await getItem(key);
                setAsyncGetItem(result);
              }}
              showResult={true}
              result={asyncGetItem}
            />
            <NativeFuncCallResult
              funcDes={'removeItem(key: string)'}
              specialDesc="异步清空值"
              needParams={true}
              onReset={function (): void {
                setAsyncRemoveItem('');
              }}
              onInvoke={async (params: string[]) => {
                if (params.length < 1) {
                  Toast.show('请检查参数是否正确', Toast.CENTER);
                }
                const key = params[0];
                const result = await removeItem(key);
                setAsyncRemoveItem(result ? '已清空' : '清空失败');
              }}
              showResult={true}
              result={asyncRemoveItem}
            />
          </View>
          <View style={styles.container}>
            <Text style={styles.title}>同步api</Text>
            <NativeFuncCallResult
              funcDes={'setItemSync(key: string, value: string)'}
              specialDesc="同步设置值"
              needParams={true}
              onReset={function (): void {
                setSyncSetItem('');
              }}
              onInvoke={(params: string[]) => {
                if (params.length < 2) {
                  Toast.show('请检查参数是否正确', Toast.CENTER);
                }
                const key = params[0];
                const value = params[1];
                setItemSync(key, value);
                const result = getItemSync(key);
                setSyncSetItem(result);
              }}
              showResult={true}
              result={syncSetItem}
            />
            <NativeFuncCallResult
              funcDes={'getItemSync(key: string)'}
              specialDesc="同步获取值"
              needParams={true}
              onReset={function (): void {
                setSyncGetItem('');
              }}
              onInvoke={(params: string[]) => {
                if (params.length < 1) {
                  Toast.show('请检查参数是否正确', Toast.CENTER);
                }
                const key = params[0];
                const result = getItemSync(key);
                setSyncGetItem(result);
              }}
              showResult={true}
              result={syncGetItem}
            />
            <NativeFuncCallResult
              funcDes={'removeItemSync(key: string)'}
              specialDesc="同步清空值"
              needParams={true}
              onReset={function (): void {
                setSyncRemoveItem('');
              }}
              onInvoke={(params: string[]) => {
                if (params.length < 1) {
                  Toast.show('请检查参数是否正确', Toast.CENTER);
                }
                const key = params[0];
                const result = removeItemSync(key);
                setSyncRemoveItem(result ? '已清空' : '清空失败');
              }}
              showResult={true}
              result={syncRemoveItem}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Page>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
    paddingTop: 10,
  },
  title: {
    color: '#333',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 10,
  },
});

XrnNativeStorageScreen.navigationOptions = {
  title: 'XrnNativeStorage',
};
