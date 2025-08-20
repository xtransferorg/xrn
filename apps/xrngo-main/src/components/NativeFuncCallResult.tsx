import React, {useState} from 'react';
import {
  // Button,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
// import Toast from 'react-native-simple-toast';
// import Button from './Button';
import {Input, Button, Fill} from '@xrnjs/ui';
import Colors from '../constants/Colors';
import {Card, List, Space, Title} from '@xrnjs/ui';

function splitParams(input: string): string[] {
  return input.split(',');
}

function copy2Clipboard(text: string) {
  Clipboard.setString(text);
  // Toast.show('已复制', Toast.SHORT);
}

export function NativeFuncCallResult({
  funcDes,
  specialDesc,
  needParams,
  onInvoke,
  onReset,
  showResult,
  result,
}: Props) {
  const [input, setInput] = useState('');

  function clearInputText() {
    setInput('');
  }

  return (
    <Card>
      <View style={styles.card}>
        <Text
          style={styles.funcDesc}
          onLongPress={() => {
            copy2Clipboard(funcDes);
          }}>
          {funcDes}
        </Text>
        {specialDesc && (
          <Text
            style={styles.specialDesc}
            onLongPress={() => {
              copy2Clipboard(specialDesc);
            }}>
            {specialDesc}
          </Text>
        )}
        {needParams && (
          <View style={styles.paramsInputContainer}>
            <Input
              style={styles.parmasInput}
              placeholder="请输入实参列表，逗号分隔"
              value={input}
              onChangeText={text => {
                setInput(text);
              }}
            />
          </View>
        )}
        <View style={styles.operations}>
          <TouchableOpacity style={styles.reset}>
            <Button
              fill={Fill.outline}
              // title="重置"
              // color={Colors.tintColor}
              onPress={() => {
                console.log(`${funcDes}方法重置`);
                clearInputText();
                onReset();
              }}>
              重置
            </Button>
          </TouchableOpacity>
          <TouchableOpacity style={styles.funcInvoke}>
            <Button
              // title="调用"
              // color={Colors.tintColor}
              onPress={() => {
                const params = splitParams(input);
                console.log(`${funcDes}调用，参数：${input}`);
                onInvoke(params);
              }}>
              调用
            </Button>
          </TouchableOpacity>
        </View>
        {showResult && result && (
          <Text
            style={styles.result}
            onLongPress={() => {
              copy2Clipboard(result);
            }}>
            {/* {result && '结果：' + result} */}
            结果：{result}
          </Text>
        )}
      </View>
    </Card>
  );
}

type Props = {
  funcDes: string;
  specialDesc?: string;
  needParams: boolean;
  onReset: () => void;
  onInvoke: (params: string[]) => void;
  showResult: boolean;
  result: string;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    padding: 10,
    paddingBottom: 20,
    gap: 12,
  },
  funcDesc: {
    fontSize: 16,
    lineHeight: 24,
  },
  specialDesc: {
    fontSize: 14,
    lineHeight: 21,
    color: '#000000',
    fontWeight: '600',
  },
  paramsInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  paramsBracket: {
    fontSize: 20,
  },
  parmasInput: {
    flex: 1,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#99999933',
    padding: 5,
  },
  operations: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    gap: 15,
    marginTop: 5,
  },
  reset: {
    flex: 1,
    fontSize: 20,
    width: '40%',
  },
  funcInvoke: {
    flex: 1,
    fontSize: 20,
    width: '40%',
  },
  result: {
    fontSize: 16,
    lineHeight: 24,
  },
});
