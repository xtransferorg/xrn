import React, { useState } from "react";
import { ScrollView, StyleSheet, View, Text } from "react-native";
import { Page } from "../../components/Page";
import { useAsyncEffect } from "ahooks";
import XtAppMainCard, { CardProps } from "./XtAppMainCard";
import { BundleInfoList } from "./types";
import DeviceInfo from "react-native-device-info";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { XRNBundle } from "@xrnjs/bundle";
import CodePush from '@xrnjs/react-native-code-push';

const CodepushInfo = () => {
  const [bundleList, setBundleList] = useState<CardProps[]>([]);
  const [getDeviceName, setDeviceName] = useState<string>();
  const [extInfo, setExtInfo] = useState({
    serverGrantId: "",
  });
  const [user, setUser] = useState<
    { label: string; value?: string | number }[]
  >([{ label: "user", value: "id:no_login_user" }]);

  useAsyncEffect(async () => {
    const metaDataObj = await XRNBundle?.getAllBundleInfos?.();
    const serverGrantId = await AsyncStorage.getItem("serverGrantId") as string;
    setExtInfo({ serverGrantId });

    setDeviceName(await DeviceInfo.getDeviceName());

    const config = (await CodePush?.getConfiguration?.()) as { serverUrl: string, clientUniqueId: string };
    setUser([
      { label: 'CodePush.serverUrl', value: config.serverUrl },
      { label: 'CodePush.clientUniqueId', value: "" },
    ]);

    try {
      // const metaDataStr = JSON.parse(metaDataStr)
      if (metaDataObj) {
        // setMetaData(obj)
        if (Array.isArray((metaDataObj as BundleInfoList).bundleInfoList)) {
          const _bundleList: CardProps[] = (
            metaDataObj as BundleInfoList
          ).bundleInfoList.map(({ bundleName, codePushPackage }) => ({
            bundleName: bundleName,
            isHeader: false,
            title: bundleName,
            titleKey: "bundle名称",
            records: [
              { label: "Label", value: codePushPackage?.label || "" },
              { label: "描述信息", value: codePushPackage?.description || "" },
              {
                label: "强制更新",
                value: codePushPackage?.isMandatory ? "是" : "否",
              },
              {
                label: "deploymentKey(CodePush应用Token)",
                value: codePushPackage?.deploymentKey || "",
              },
              {
                label: "packageHash",
                value: codePushPackage?.packageHash || "",
              }
            ],
          }));
          setBundleList(_bundleList);
        }
      }
    } catch (e) {
      // console.error(e)
    };

  }, []);

  return (
    <Page title={"codepush信息"} hideHeader>
      <View
        style={{
          flex: 1,
        }}
      >
        <ScrollView style={styles.container}>
          <XtAppMainCard
            bundleName="main"
            isHeader={true}
            copyVisible
            title={"search 参数"}
            titleKey={"Sentry"}
            records={[
              { label: "device", value: getDeviceName },
              {
                label: "os",
                value: `${DeviceInfo.getSystemName()} ${DeviceInfo.getSystemVersion()}`,
              },
              // { label: 'uniqueId', value: uniqueId },
              { label: "App版本号", value: DeviceInfo.getVersion() },
              { label: "serverGrantId", value: extInfo?.serverGrantId || "" },
              ...user,
            ]}
          />
          {bundleList.map((i, index) => (
            <View>
              <XtAppMainCard key={index} {...i} />
            </View>
          ))}
        </ScrollView>
      </View>
    </Page>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // marginTop: 10,
  },
});

export default CodepushInfo;
