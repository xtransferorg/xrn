import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  NativeModules,
  Platform,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Page } from "../../components/Page";

import styles from "./style";
import { DebugCommonItem } from "./type";
import { nativeToast } from "../../utils/toast";
import { ROUTES } from "../..";
import { XRNAppUtils } from '@xrnjs/app-utils'
import { XRNDebugTools } from '@xrnjs/debug-tools'
import { XRNNativeStorage } from '@xrnjs/native-storage'
import { bundleList } from "../../utils/bundleManager";

const XRNDebugToolsModule = NativeModules?.XRNDebugToolsModule;
const supportCommon = "supportCommon";

const DebugCommon: React.FC = () => {
  const [data, setData] = useState<DebugCommonItem[]>([]);

  useEffect(() => {
    _formatInitialData();
  }, []);

  const _formatInitialData = async () => {
    const bundles = await bundleList();
    const dataSource: DebugCommonItem[] = [];
    bundles.forEach((item: any) => {
      const key = `${item?.bundleName}-${supportCommon}`;
      const enableCommon =
        Platform.OS === "android"
          ? XRNDebugToolsModule?.isSplitBundleEnabled?.(item.bundleName)
          : XRNNativeStorage?.getItemSync?.(key) !== "0";
      dataSource.push({
        bundleName: item?.bundleName,
        enableCommon
      });
    });
    setData(dataSource);
  };

  const _confirmClick = () => {
    data.forEach((item: any) => {
      const key = `${item?.bundleName}-${supportCommon}`;
      if (Platform.OS === "android") {
        XRNDebugToolsModule?.setSplitBundleEnabled?.(
          item.bundleName,
          item.enableCommon,
        );
      } else {
        XRNNativeStorage?.setItemSync?.(
          key,
          String(Number(item?.enableCommon)),
        );
      }
    });

    nativeToast("设置成功，重新APP后生效~");
    setTimeout(() => {
      XRNAppUtils?.exitApp?.();
    }, 3000);
  };

  const _toggleSwitch = (item: DebugCommonItem) => {
    const updatedData = data.map((bundle) =>
      bundle.bundleName === item.bundleName
        ? { ...bundle, enableCommon: !bundle.enableCommon }
        : bundle,
    );
    setData(updatedData);
  };

  const _renderItem = ({ item }: { item: DebugCommonItem }) => {
    return (
      <View style={styles.listItem}>
        <Text style={styles.bundleName}>{item.bundleName}</Text>
        <Switch
          style={styles.switch}
          onValueChange={() => _toggleSwitch(item)}
          value={item.enableCommon}
        />
      </View>
    );
  };

  const _listHeader = () => {
    return (
      <View style={styles.headerContainer}>
        <View style={styles.bundleContainer}>
          <Text style={styles.bundleTip}>
            1.根据需要决定是否启用对应bundle的common包(默认每个bundle都启用)，如果关闭开关对应bundle会在调试模式下走全量bundle加载
          </Text>
          <Text style={styles.bundleTip}>2.操作本开关之后，请重新yarn start，启动metro服务</Text>
        </View>
      </View>
    );
  };

  return (
    <Page title="启用common包" hideHeader>
      <View style={styles.container}>
        <FlatList
          data={data}
          renderItem={_renderItem}
          keyExtractor={(item) => item.bundleName}
          ListHeaderComponent={_listHeader}
        />
        <TouchableOpacity
          accessibilityLabel="confirm.75d69171"
          style={styles.confirm}
          onPress={() => _confirmClick()}
        >
          <Text style={styles.confirmText}>保存并重启APP</Text>
        </TouchableOpacity>
      </View>
    </Page>
  );
};

export default DebugCommon;
