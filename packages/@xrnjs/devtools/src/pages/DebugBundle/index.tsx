import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  NativeModules,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DeviceInfo from "react-native-device-info";
import Svg, { Path } from "react-native-svg";
import { Page } from "../../components/Page";
import { useNavRightButton } from "../../hooks/navigation";
import { bundleList } from "../../utils/bundleManager";

import IPTextInput from "./IPTextInput";
import styles from "./style";
import { DebugBundleItem } from "./type";
import { nativeToast } from "../../utils/toast";
import {
  sensorsFundClick,
  sensorsFundPageView,
} from "../../utils/sensorsTrack";
import { ROUTES } from "../..";
import { XRNNativeStorage } from "@xrnjs/native-storage";
import { XRNAppUtils } from "@xrnjs/app-utils";
import { Platform, requireNativeModule } from "@xrnjs/modules-core";
import { XRNDebugToolsModule } from '@xrnjs/debug-tools'
import debounce from 'lodash/debounce'

const enableDebugKey = "enableDebug";
const enableCodepushKey = "enableCodepush";
const enableCommonKey = "enableCommon";
const portKey = "port";

const DebugBundle: React.FC = (props: any) => {
  const { navigation } = props;
  const isEmulator = DeviceInfo.isEmulatorSync();
  const [data, setData] = useState<DebugBundleItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<DebugBundleItem | null>(
    null,
  );
  const [settingModalVisible, setSettingModalVisible] = useState(false);
  const [infoModalVisible, setInfoModalVisible] = useState(false);

  const ipRef = useRef(getBundleHostIP());

  useEffect(() => {
    sensorsFundPageView({ module_name: `devtools_${ROUTES.DebugBundle}` });
  }, []);

  useEffect(() => {
    _formatInitialData();
  }, []);

  const _formatInitialData = async () => {
    // const bundles = await XRNDebugToolsModule?.getAllBundlesDataSync();
    const bundles = await bundleList();

    const dataSource: DebugBundleItem[] = [];
    bundles.forEach(async (item: any) => {
      // 从native存储获取bundle调试状态
      // XRNNativeStorage?.removeItemSync?.(`${item?.bundleName}-debug`);
      let debugInfo = {};

      if (Platform.OS === "android") {
        debugInfo =
          (await XRNDebugToolsModule?.getBundleDebugConfig?.(
            item?.bundleName,
          )) || {};
      } else {
        const debugInfoStr = XRNNativeStorage?.getItemSync?.(
          `${item?.bundleName}-debug`,
        );
        if (debugInfoStr) {
          try {
            debugInfo = JSON.parse(debugInfoStr);
          } catch (error) {
            console.log("解析动态bundle列表失败:", error);
          }
        }
      }

      const enableDebug = debugInfo?.[enableDebugKey] === "1";
      const enableEditPort = item?.deliveryType !== "INNER";
      const port = debugInfo?.[portKey] || item?.port;
      const enableCodepush = debugInfo?.[enableCodepushKey] === "1";
      const enableCommon = debugInfo?.[enableCommonKey] !== "0";
      dataSource.push({
        bundleName: item?.bundleName,
        enableDebug,
        enableEditPort,
        port: port || "",
        enableCodepush,
        enableCommon,
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

  function extractHostAndPort(urlString) {
    if (urlString.includes(":")) {
      const [host, port] = urlString.split(":");
      return host;
    } else {
      return urlString;
    }
  }

  const _confirmClick = () => {
    sensorsFundClick({
      button_name: "devtools_btn_click",
      devtools_click_btn_name: "调试bundle 保存并重启点击",
    });
    console.log(`ip=${ipRef.current}`);
    const result = extractHostAndPort(ipRef.current);
    console.log(`extracted ip=${result}`, ipRef.current);
    if (
      Platform.OS === "android" &&
      ipRef.current &&
      !_checkIPLegality(result)
    ) {
      nativeToast("IP地址 格式不正确，请检查~");
      return;
    } else if (
      Platform.OS === "ios" &&
      !_checkIPLegality(result) &&
      !isEmulator
    ) {
      nativeToast("IP地址 格式不正确，请检查~");
      return;
    }
    setBundleHostIP(result);

    data.forEach(async (item: DebugBundleItem) => {
      const debugKey = `${item?.bundleName}-debug`;
      let debugInfo = {};
      if (Platform.OS === "android") {
        debugInfo =
          (await XRNDebugToolsModule?.getBundleDebugConfig?.(
            `${item?.bundleName}`,
          )) || {};
      } else {
        const debugInfoStr = XRNNativeStorage?.getItemSync?.(debugKey);
        if (debugInfoStr) {
          try {
            debugInfo = JSON.parse(debugInfoStr);
          } catch (error) {
            console.log("解析动态bundle列表失败:", error);
          }
        }
      }
      debugInfo[enableDebugKey] = item?.enableDebug === true ? "1" : "0";
      debugInfo[enableCodepushKey] = item?.enableCodepush === true ? "1" : "0";
      debugInfo[enableCommonKey] = item?.enableCommon === true ? "1" : "0";
      const portNum = item?.port ? Number(item?.port) : 0;
      debugInfo[portKey] = Number.isNaN(portNum) ? 0 : portNum;
      if (Platform.OS === "android") {
        await XRNDebugToolsModule?.setBundleDebugConfig?.(
          item.bundleName,
          debugInfo,
        );
      } else {
        const updatedBundleStr = JSON.stringify(debugInfo);
        XRNNativeStorage?.setItemSync?.(debugKey, updatedBundleStr);
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

  const _debugSwitch = (item: DebugBundleItem) => {
    sensorsFundClick({
      button_name: "devtools_btn_click",
      devtools_click_btn_name: "调试bundle 切换调试开关",
    });
    item.enableDebug = !item.enableDebug;
    const updatedData = data.map((bundle) =>
      bundle.bundleName === item.bundleName
        ? { ...bundle, enableDebug: item.enableDebug }
        : bundle,
    );
    setData(updatedData);
  };

  const _codepushSwitch = (item: DebugBundleItem) => {
    sensorsFundClick({
      button_name: "devtools_btn_click",
      devtools_click_btn_name: "codepush bundle 切换调试开关",
    });
    item.enableCodepush = !item.enableCodepush;
    const updatedData = data.map((bundle) =>
      bundle.bundleName === item.bundleName
        ? { ...bundle, enableCodepush: item.enableCodepush }
        : bundle,
    );
    setData(updatedData);
  };

  const _commonSwitch = (item: DebugBundleItem) => {
    sensorsFundClick({
      button_name: "devtools_btn_click",
      devtools_click_btn_name: "common包 切换调试开关",
    });
    item.enableCommon = !item.enableCommon;
    const updatedData = data.map((bundle) =>
      bundle.bundleName === item.bundleName
        ? { ...bundle, enableCommon: item.enableCommon }
        : bundle,
    );
    setData(updatedData);
  };

  const _editPort = debounce((item: DebugBundleItem, port: string) => {
    sensorsFundClick({
      button_name: "devtools_btn_click",
      devtools_click_btn_name: "port 输入完成",
    });
    item.port = port;
    console.log("端口号为" + item.port);
    const updatedData = data.map((bundle) =>
      bundle.bundleName === item.bundleName
        ? { ...bundle, port: item.port }
        : bundle,
    );
    setData(updatedData);
  }, 2000);

  const _renderItem = ({ item }: { item: DebugBundleItem }) => {
    return (
      <View style={styles.listItem}>
        <View
          style={{
            justifyContent: "space-between",
            flexDirection: "row",
            width: "100%",
            alignItems: "center",
          }}
        >
          <Text style={styles.bundleName}>{item.bundleName}</Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingLeft: 10,
            }}
          >
            {/* 热更状态 */}
            {/* <View style={{ flexDirection: "row", alignItems: "center", marginRight: 8 }}>
              <Text style={styles.bundleInfo}>热更</Text>
              {item.codepushEnable ? 
                <View style={styles.greenDot} /> : 
                <View style={styles.redDot} />
              }
            </View> */}

            {/* 调试状态 */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Switch
                style={styles.switch}
                onValueChange={() => _debugSwitch(item)}
                value={item.enableDebug}
              />
              <TouchableOpacity
                onPress={() => {
                  setSelectedItem(item);
                  setSettingModalVisible(true);
                }}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginLeft: 8,
                  marginRight: 16,
                }}
              >
                <Text style={styles.bundleInfo}>更多</Text>
                <Svg
                  width={7}
                  height={12}
                  viewBox="0 0 7 12"
                  style={styles.moreChevron}
                >
                  <Path
                    d="M1.5 1L5.5 6 1.5 11"
                    fill="none"
                    stroke="#333333"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const _listHeader = () => {
    return (
      <View style={styles.headerContainer}>
        <View style={styles.ipContainer}>
          <Text style={styles.tipStyle}>* 输入IP地址，或者扫码绑定IP地址</Text>
          <IPTextInput onValueChange={_handleChangeText} ip={ipRef.current} />
        </View>
        <View style={styles.bundleContainer}>
          <Text style={styles.bundleTip}>
            * 开关控制本地调试，点击「更多」打开其他设置
          </Text>
        </View>
      </View>
    );
  };

  const _detailInfoClick = () => {
    setInfoModalVisible(true);
  };

  const _scanClick = () => {
    navigation?.navigate("ScanQRPage");

    sensorsFundClick({
      button_name: "devtools_btn_click",
      devtools_click_btn_name: "调试bundle 扫码绑IP",
    });
  };

  const rightButton = useNavRightButton(() => {
    return (
      <View style={{ flexDirection: "row" }}>
        <TouchableOpacity
          accessibilityLabel="scanContainer.a4cf45b2"
          style={styles.scanContainer}
          onPress={() => _detailInfoClick()}
        >
          <Text style={styles.modalBundleName}>说明</Text>
        </TouchableOpacity>
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
      </View>
    );
  });
  const _closeSettingModal = () => {
    setSettingModalVisible(false);
    setSelectedItem(null);
  };
  const _closeInfoModal = () => {
    setInfoModalVisible(false);
  };

  function SettingBundleModal() {
    if (!selectedItem) {
      return null;
    }
    const item = selectedItem as DebugBundleItem;
    return (
      <View>
        {/* <View style={styles.modalListItem}>
          <Text style={styles.modalBundleName}>本地调试</Text>
          <Switch
            style={styles.switch}
            onValueChange={() => _debugSwitch(item)}
            value={item.enableDebug}
          />
        </View> */}
        <View style={styles.modalListItem}>
          <Text style={styles.modalBundleName}>热更新</Text>
          <Switch
            style={styles.switch}
            onValueChange={() => _codepushSwitch(item)}
            value={item.enableCodepush}
          />
        </View>
        <View style={styles.modalListItem}>
          <Text style={styles.modalBundleName}>启用common包</Text>
          <Switch
            style={styles.switch}
            onValueChange={() => _commonSwitch(item)}
            value={item.enableCommon}
          />
        </View>
        <View style={styles.modalListItem}>
          <Text style={styles.modalBundleName}>{"端口号:" + item.port}</Text>
          {item.enableEditPort ? (
            <TextInput
              keyboardType="number-pad"
              style={styles.modalPortInput}
              placeholderTextColor="#666"
              placeholder={item.port ? String(item.port) : "请输入端口号"}
              onChange={(e) => {
                _editPort(item, e.nativeEvent.text);
              }}
            />
          ) : (
            <Text>内置Bundle不可修改</Text>
          )}
        </View>
      </View>
    );
  }
  function InfoModal() {
    return (
      <View>
        <Text style={styles.modalBundleName}>{"*启用common包"}</Text>
        <Text style={styles.infoModalText}>
          {
            "1.根据需要决定是否启用对应bundle的common包(默认每个bundle都启用)，如果关闭开关对应bundle会在调试模式下走全量bundle加载\n2.操作本开关之后，请重新yarn start，启动metro服务"
          }
        </Text>
        <View style={{ height: 16 }}></View>
        <Text style={styles.modalBundleName}>{"*端口号设置"}</Text>
        <Text style={styles.infoModalText}>
          {"内置包不可以更改端口号，动态下发包可以设置端口号"}
        </Text>
      </View>
    );
  }
  return (
    <Page title="Bundle 调试" rightButton={rightButton}>
      <View style={styles.container}>
        <FlatList
          data={data}
          renderItem={_renderItem}
          keyExtractor={(item) => item.bundleName}
          ListHeaderComponent={_listHeader}
        />
        <Modal
          animationType="fade"
          transparent
          visible={settingModalVisible}
          onRequestClose={_closeSettingModal}
        >
          <TouchableOpacity
            style={styles.modalBackground}
            activeOpacity={1}
            onPress={_closeSettingModal} // 点击阴影关闭
          >
            <View style={styles.modalContainer}>
              <TouchableOpacity
                activeOpacity={1}
                onPress={(e) => e.stopPropagation()}
                style={{ flex: 1 }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    width: "100%",
                  }}
                >
                  <Text style={[styles.normalText]}>
                    {selectedItem?.bundleName + "    有问题先看屏幕右上角说明"}
                  </Text>
                </View>
                <SettingBundleModal />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
        <Modal
          animationType="fade"
          transparent
          visible={infoModalVisible}
          onRequestClose={_closeInfoModal}
        >
          <TouchableOpacity
            style={styles.modalBackground}
            activeOpacity={1}
            onPress={_closeInfoModal} // 点击阴影关闭
          >
            <View style={styles.modalContainer}>
              <TouchableOpacity
                activeOpacity={1}
                onPress={(e) => e.stopPropagation()}
                style={{ flex: 1 }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    width: "100%",
                  }}
                >
                  {/* <Text style={[styles.normalText]}>
                    {selectedItem?.bundleName}
                  </Text> */}
                </View>
                <InfoModal />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
        <View style={{ height: 70 }} />
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
