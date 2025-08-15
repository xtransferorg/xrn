import React from "react";

import { StyleSheet, Text, View } from "react-native";
import { Page } from "@xrnjs/core";

const styles = StyleSheet.create({
  container: {
    flex: 1, // 填充整个屏幕
    justifyContent: "center", // 垂直居中
    alignItems: "center", // 水平居中
    backgroundColor: "#f0f0f0", // 背景颜色
  },
});

export default function App() {
  return (
    <Page title="子 Bundle">
      <View style={styles.container}>
        <Text style={{ fontSize: 20 }}>Sub Bundle（热更新内容）</Text>
      </View>
    </Page>
  );
}
