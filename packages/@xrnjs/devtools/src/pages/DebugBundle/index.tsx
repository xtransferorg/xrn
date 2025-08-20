import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  Image,
  NativeModules,
  Platform,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import DeviceInfo from "react-native-device-info";
import { Page } from "../../components/Page";
import { useNavRightButton } from "../../hooks/navigation";
import { bundleList } from "../../utils/bundleManager";

import IPTextInput from "./IPTextInput";
import styles from "./style";
import { DebugBundleItem } from "./type";
import { nativeToast } from "../../utils/toast";
import { ROUTES } from "../..";
import { XRNNativeStorage } from "@xrnjs/native-storage";
import { XRNAppUtils } from "@xrnjs/app-utils";

const XRNDebugToolsModule = NativeModules?.XRNDebugToolsModule;

const DebugBundle: React.FC = (props: any) => {
  const { navigation } = props;
  const isEmulator = DeviceInfo.isEmulatorSync();
  const [data, setData] = useState<DebugBundleItem[]>([]);
  const ipRef = useRef(getBundleHostIP());

  useEffect(() => {
    _formatInitialData();
  }, []);

  const _formatInitialData = async () => {
    const bundles = await bundleList();
    const dataSource: DebugBundleItem[] = [];
    bundles?.forEach((item: any) => {
      const debugEnable =
        Platform.OS === "android"
          ? XRNDebugToolsModule?.isBundleDebugSync?.(`${item?.bundleName}`)
          : XRNNativeStorage?.getItemSync?.(`${item?.bundleName}-debug`) ===
            "1";
      dataSource.push({
        bundleName: item?.bundleName,
        debugEnable,
      });
    });
    setData(dataSource);
  };

  const _handleChangeText = (text: string) => {
    ipRef.current = text;
  };

  function getBundleHostIP(): string {
    if (Platform.OS === "android") {
      return XRNDebugToolsModule?.getBundleHostIPSync?.() || "";
    } else if (!isEmulator && Platform.OS === "ios") {
      return XRNNativeStorage?.getItemSync?.("RCT_jsLocation") || "";
    } else {
      return "";
    }
  }

  function setBundleHostIP(ip: string) {
    if (Platform.OS === "android") {
      XRNDebugToolsModule?.setBundleHostIP?.(ip);
    } else if (!isEmulator && Platform.OS === "ios") {
      XRNNativeStorage?.setItemSync?.("RCT_jsLocation", ip);
    }
  }

  const _confirmClick = () => {
    console.log(`ip=${ipRef.current}`);
    if (
      Platform.OS === "android" &&
      ipRef.current &&
      !_checkIPLegality(ipRef.current)
    ) {
      nativeToast("IP地址 格式不正确，请检查~");
      return;
    } else if (
      Platform.OS !== "android" &&
      !_checkIPLegality(ipRef.current) &&
      !isEmulator
    ) {
      nativeToast("IP地址 格式不正确，请检查~");
      return;
    }
    setBundleHostIP(ipRef.current);
    data.forEach((item: any) => {
      if (Platform.OS === "android") {
        XRNDebugToolsModule?.setBundleDebugSync?.(
          `${item?.bundleName}`,
          item?.debugEnable
        );
      } else {
        XRNNativeStorage?.setItemSync?.(
          `${item?.bundleName}-debug`,
          String(Number(item?.debugEnable))
        );
      }
    });

    nativeToast("设置成功，重新APP后生效~");
    setTimeout(() => {
      XRNAppUtils?.exitApp?.();
    }, 3000);
  };

  const _checkIPLegality = (ip: string) => {
    const parts = ip.split(".");
    if (parts.length !== 4) {
      return false;
    }

    for (const part of parts) {
      const num = Number(part);
      if (isNaN(num) || num < 0 || num > 255 || !/^\d+$/.test(part)) {
        return false;
      }
    }
    return true;
  };

  const _toggleSwitch = (item: DebugBundleItem) => {
    const updatedData = data.map((bundle) =>
      bundle.bundleName === item.bundleName
        ? { ...bundle, debugEnable: !bundle.debugEnable }
        : bundle
    );
    setData(updatedData);
  };

  const _renderItem = ({ item }: { item: DebugBundleItem }) => {
    return (
      <View style={styles.listItem}>
        <Text style={styles.bundleName}>{item.bundleName}</Text>
        <Switch
          style={styles.switch}
          onValueChange={() => _toggleSwitch(item)}
          value={item.debugEnable}
        />
      </View>
    );
  };

  const _listHeader = () => {
    return (
      <View style={styles.headerContainer}>
        <View style={styles.ipContainer}>
          <Text style={styles.tipStyle}>输入IP地址，或者扫码绑定IP地址</Text>
          <IPTextInput onValueChange={_handleChangeText} ip={ipRef.current} />
        </View>
        <View style={styles.bundleContainer}>
          <Text style={styles.bundleTip}>勾选需要调试的bundle</Text>
        </View>
      </View>
    );
  };

  const _scanClick = () => {
    navigation?.navigate("ScanQRPage");
  };

  const rightButton = useNavRightButton(() => {
    return (
      <TouchableOpacity
        accessibilityLabel="scanContainer.a4cf45b2"
        style={styles.scanContainer}
        onPress={() => _scanClick()}
      >
        <Image
          style={styles.scanStyle}
          source={require("../../../assets/doraemon_scan.png")}
        />
      </TouchableOpacity>
    );
  });

  return (
    <Page title="动态调试bundle" rightButton={rightButton} hideHeader>
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

export default DebugBundle;
