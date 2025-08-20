import React, {useState} from 'react';
import {Button, StyleSheet, Text, TextInput, View} from 'react-native';

function splitParams(input: string): string[] {
  return input.split(',');
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
    <View style={styles.card}>
      <Text style={styles.funcDesc}>{funcDes}</Text>
      {specialDesc && <Text style={styles.specialDesc}>{specialDesc}</Text>}
      {needParams && (
        <TextInput
          style={styles.parmasInput}
          placeholder="请输入实参列表，逗号分隔"
          value={input}
          onChangeText={text => {
            setInput(text);
          }}
        />
      )}
      <View style={styles.operations}>
        <Button
          style={styles.reset}
          title="重置"
          onPress={() => {
            console.log(`${funcDes}方法重置`);
            clearInputText();
            onReset();
          }}
        />

        <Button
          style={styles.funcInvoke}
          title="调用"
          onPress={() => {
            const params = splitParams(input);
            console.log(`${funcDes}调用，参数：${input}`);
            onInvoke(params);
          }}
        />
      </View>
      {showResult && <Text style={styles.result}>结果：{result}</Text>}
    </View>
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
    borderWidth: 1,
    borderColor: '#99999980',
    backgroundColor: '#ffffff',
    padding: 10,
    gap: 10,
  },
  funcDesc: {
    fontSize: 15,
  },
  specialDesc: {
    fontSize: 15,
    color: '#000000',
    fontWeight: 'bold',
  },
  parmasInput: {
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#99999933',
    padding: 5,
  },
  operations: {
    flexDirection: 'row',
    width: '100%',
    height: 60,
    alignItems: 'center',
    gap: 20,
  },
  reset: {
    fontSize: 20,
    width: '40%',
  },
  funcInvoke: {
    fontSize: 20,
    width: '40%',
  },
  result: {
    fontSize: 15,
  },
});
