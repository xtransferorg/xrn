import Clipboard from "@react-native-clipboard/clipboard";
import React from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { getItemSync } from "../../utils/storage";

export interface CardProps {
  bundleName: string;
  title: string;
  titleKey: string;
  records: { label: string; value?: string | number }[];
  copyVisible?: boolean;
  isHeader: boolean;
}

const XtAppMainCard: React.FC<CardProps> = (data) => {
  const { title, titleKey, records, copyVisible, isHeader, bundleName } = data;

  const handleCopy = () => {
    Clipboard.setString(
      data.records
        .filter((i) => !!i.value)
        .map(({ label, value }) => `${label}:"${value}"`)
        .join(" ")
    );
  };

  return (
    <View style={styles.bundleContainer}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Text style={styles.bundleName}>
          {titleKey}: {title}
        </Text>
        {copyVisible && (
          <TouchableOpacity
            style={{
              marginLeft: 20,
              width: 50,
              height: 30,
              backgroundColor: "orange",
              borderRadius: 15,
              justifyContent: 'center',
              alignItems: 'center'
            }}
            onPress={handleCopy}
          >
            <Text>复制</Text>
          </TouchableOpacity>
        )}
      </View>
      {!!records && (
        <View style={styles.packageContainer}>
          {records.map(({ label, value }, index) => (
            <View>
              <Text key={index}> {label}: {value} </Text>
            </View>
          ))}
        </View>
      )}
      {
        isHeader ? <></> : 
        <TouchableOpacity onPress={() => {
          Clipboard.setString(getItemSync('dev_support', `${bundleName}-codepush-key`) as string);
        }}>
          <Text style={{  backgroundColor: "#f5f5f5", marginTop: 10}}>{`内置的codePushKey：${getItemSync('dev_support', `${bundleName}-codepush-key`) || "" }`}</Text>
        </TouchableOpacity>
      }
    </View>
  );
};

const styles = StyleSheet.create({
  bundleContainer: {
    backgroundColor: "#f5f5f5",
    marginVertical: 8,
    padding: 16,
    borderRadius: 8,
  },
  packageContainer: {
    marginTop: 10,
  },
  bundleName: {
    fontWeight: "bold",
  },
  // 这里可以定义更多样式
});

export default XtAppMainCard;
