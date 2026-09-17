import Clipboard from "@react-native-clipboard/clipboard";
import { fetch } from "@react-native-community/netinfo";
import React, { useEffect, useState } from "react";
import { FlatList, Image, Text, TouchableOpacity, View } from "react-native";
import DeviceInfoModule from "react-native-device-info";
import { Page } from "../../components/Page";
import { useNavRightButton } from "../../hooks/navigation";

import styles from "./style";
import { DeviceInfoItem } from "./type";
import { nativeToast } from "../../utils/toast";
import { sensorsFundClick, sensorsFundPageView } from "../../utils/sensorsTrack";
import { ROUTES } from "../..";

const DeviceInfo: React.FC = () => {
  const infoList: DeviceInfoItem[] = [];
  const [data, setData] = useState<DeviceInfoItem[]>(infoList);

  useEffect(() => {
    sensorsFundPageView({ module_name: `devtools_${ROUTES.DeviceInfo}` });
  }, []);

  useEffect(() => {
    if (DeviceInfoModule.getBrand) {
      infoList.push({
        title: "手机品牌",
        value: DeviceInfoModule.getBrand(),
      });
    }

    if (DeviceInfoModule.getManufacturerSync) {
      infoList.push({
        title: "手机制造商",
        value: DeviceInfoModule.getManufacturerSync(),
      });
    }

    if (DeviceInfoModule.getSystemName) {
      infoList.push({
        title: "手机系统",
        value: DeviceInfoModule.getSystemName(),
      });
    }

    if (DeviceInfoModule.getSystemVersion) {
      infoList.push({
        title: "系统版本",
        value: DeviceInfoModule.getSystemVersion(),
      });
    }

    if (DeviceInfoModule.getDeviceId) {
      infoList.push({
        title: "型号标识符",
        value: DeviceInfoModule.getDeviceId(),
      });
    }

    if (DeviceInfoModule.getModel) {
      infoList.push({
        title: "设备名称",
        value: DeviceInfoModule.getModel(),
      });
    }

    // if (DeviceInfoModule.getUniqueIdSync) {
    //   infoList.push({
    //     title: "设备唯一标识符",
    //     value: DeviceInfoModule.getUniqueIdSync(),
    //   });
    // }

    if (DeviceInfoModule.getCarrierSync) {
      infoList.push({
        title: "网络运营商",
        value: DeviceInfoModule.getCarrierSync(),
      });
    }

    if (DeviceInfoModule.getTotalMemorySync) {
      infoList.push({
        title: "总内存",
        value: _formatBytesToGB(DeviceInfoModule.getTotalMemorySync()),
      });
    }

    if (DeviceInfoModule.getUsedMemorySync) {
      infoList.push({
        title: "已使用内存大小",
        value: _formatBytesToGB(DeviceInfoModule.getUsedMemorySync()),
      });
    }

    if (DeviceInfoModule.getTotalDiskCapacitySync) {
      infoList.push({
        title: "总磁盘大小",
        value: _formatBytesToGB(DeviceInfoModule.getTotalDiskCapacitySync()),
      });
    }

    if (DeviceInfoModule.getFreeDiskStorageSync) {
      infoList.push({
        title: "可用磁盘大小",
        value: _formatBytesToGB(DeviceInfoModule.getFreeDiskStorageSync()),
      });
    }

    if (DeviceInfoModule.getBatteryLevelSync) {
      infoList.push({
        title: "电池电量",
        value: DeviceInfoModule.getBatteryLevelSync().toString(),
      });
    }

    const formatAsyncInfo = async () => {
      // 获取网络信息
      const { type, isConnected } = await fetch();
      if (type) {
        const connect = isConnected ? "已连接" : "未连接";
        infoList.splice(6, 0, {
          title: "当前网络状态：",
          value: `${type}： ${connect}`,
        });
      }

      const syncUid = await DeviceInfoModule.syncUniqueId();
      if (syncUid) {
        infoList.splice(7, 0, {
          title: "设备唯一标识符：",
          value: syncUid,
        });
      }

      setData(infoList);
    };

    formatAsyncInfo();
  }, []);

  const _listHeader = () => {
    return <View />;
  };

  const _formatBytesToGB = (bytes: number): string => {
    const gigabytes = bytes / (1024 * 1024 * 1024);
    return `${gigabytes.toFixed(2)} GB`;
  };

  const _copyClick = (value: string) => {
    Clipboard.setString(value);
    nativeToast("复制成功");
    sensorsFundClick({ button_name: 'devtools_btn_click', devtools_click_btn_name: '设备信息页 复制' });
  };

  const _copyAll = () => {
    const str = _formatCopyStr(data);
    Clipboard.setString(str);
    nativeToast("一键复制成功");
    sensorsFundClick({ button_name: 'devtools_btn_click', devtools_click_btn_name: '设备信息页 一键复制' });
  };

  const _formatCopyStr = (data: DeviceInfoItem[]): string => {
    return data.map((item) => `${item.title}:\n${item.value}`).join("\n");
  };

  const _renderItem = ({ item }: { item: DeviceInfoItem }) => {
    return (
      <View style={styles.itemContainer}>
        <View style={styles.tipContainer}>
          <Text style={styles.key}>{`${item.title}：`}</Text>
          <View style={styles.valueContainer}>
            <Text style={styles.value}>{item.value}</Text>
            <TouchableOpacity
              accessibilityLabel="copyBtn.8984a1f7"
              style={styles.copyBtn}
              onPress={() => _copyClick(`${item.title}：\n${item.value}`)}
            >
              <Image
                style={styles.copyIcon}
                source={require("../../../assets/copy_icon.png")}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const rightButton = useNavRightButton(() => {
    return (
      <TouchableOpacity
        accessibilityLabel="navRightBtn.17dc54b2"
        style={styles.navRightBtn}
        onPress={() => _copyAll()}
      >
        <Text style={styles.rightBtnText}>一键复制</Text>
      </TouchableOpacity>
    );
  });

  return (
    <Page title="设备信息" rightButton={rightButton}>
      <View style={styles.container}>
        <FlatList
          data={data}
          renderItem={_renderItem}
          keyExtractor={(item) => item.title}
          ListHeaderComponent={_listHeader}
        />
      </View>
    </Page>
  );
};

export default DeviceInfo;
