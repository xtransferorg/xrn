import React from "react";

import { StyleSheet, Text, View, Button } from "react-native";

import { useNavigation } from "@xrnjs/core";

const styles = StyleSheet.create({
  container: {
    flex: 1, // 填充整个屏幕
    justifyContent: "center", // 垂直居中
    alignItems: "center", // 水平居中
    backgroundColor: "#f0f0f0", // 背景颜色
  },
});

export default function App() {
  const nav = useNavigation();
  return (
    <View style={styles.container}>
      <Text style={{ fontSize: 20 }}>main bundle 热更新</Text>
      <Button
        title="前往子 Bundle"
        onPress={() => {
          nav.navigate("/sub-bundle/sub-bundle/demo");
        }}
      />
    </View>
  );
}
