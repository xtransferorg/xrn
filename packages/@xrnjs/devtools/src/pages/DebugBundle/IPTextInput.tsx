import React, { useEffect, useMemo, useRef, useState } from "react";
import { TextInput } from "react-native";
import DeviceInfo from "react-native-device-info";

import styles from "./style";
import { IPTextInputProps } from "./type";

const IPTextInput: React.FC<IPTextInputProps> = ({ ip, onValueChange }) => {
  const isEmulator = DeviceInfo.isEmulatorSync();
  const [value, setValue] = useState(ip);

  useEffect(() => {
    onValueChange(value);
  }, [value, onValueChange]);

  const _onChangeText = (text: string) => {
    if (isEmulator) {
      return;
    }
    setValue(text);
  };

  return (
    <TextInput
      style={styles.inputStyle}
      onChangeText={_onChangeText}
      value={value}
      placeholder="请输入ip地址"
      placeholderTextColor="#666"
      returnKeyType="done"
      keyboardType="decimal-pad"
    />
  );
};

export default IPTextInput;
