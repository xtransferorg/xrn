/** @format */

import React, { useCallback, useEffect, useState } from "react";
import {
  Dimensions,
  Image,
  Linking,
  SectionList,
  Text,
  TouchableOpacity,
  View,
  NativeModules
} from "react-native";
import { Platform } from "@xrnjs/modules-core";
import { Page } from "../../components/Page";
import { navigateBundle } from "../../core/navigate";
import styles from "./style";
import { DebugCenterDataSource, DebugCenterSectionItem } from "./type";
import { ROUTES } from "../..";
import { nativeToast } from "../../utils/toast";
import openURLInBrowser from 'react-native/Libraries/Core/Devtools/openURLInBrowser';
import env from "react-native-config";
import { XRNDebugTools } from '@xrnjs/debug-tools'

const { width } = Dimensions.get("window");
const itemWidth = width / 4;
const channelShow = ["local"];

const dataSource: DebugCenterDataSource[] = [
  {
    title: "快捷入口",
    data: [
      [
        {
          text: "设备信息",
          entryType: "deviceInfo",
          routeName: "DeviceInfo",
          icon: require("../../../assets/doraemon_app_info.png"),
        },
        {
          text: "App信息",
          entryType: "appInfo",
          routeName: "AppInfo",
          icon: require("../../../assets/doraemon_file.png"),
        },
        {
          text: "Bundle信息",
          entryType: "codepushInfo",
          routeName: "CodepushInfo",
          icon: require("../../../assets/doraemon_app_start_time.png"),
        },
        {
          text: "路由信息",
          entryType: "routeInfo",
          routeName: "RouteInfo",
          icon: require("../../../assets/doraemon_view_check.png"),
        },
        {
          text: "扫码调试",
          entryType: "ScanQRPage",
          routeName: "ScanQRPage",
          debugEnable: true,
          icon: require("../../../assets/doraemon_scan.png"),
        },
        {
          text: "清理缓存",
          entryType: "cleanCache",
          icon: require("../../../assets/doraemon_qingchu.png"),
        },
        {
          text: "系统设置页",
          entryType: "appSetting",
          icon: require("../../../assets/doraemon_setting.png"),
        },
        {
          text: "任意门",
          entryType: "appLinking",
          routeName: "AppLinking",
          icon: require("../../../assets/doraemon_h5.png"),
        },
        {
          text: "常用路由",
          entryType: "schemeHistory",
          routeName: "SchemeHistory",
          icon: require("../../../assets/doraemon_health.png"),
        },
        {
          text: "网络诊断",
          entryType: "networkDiagnosis",
          routeName: "NetworkDiagnosis",
          icon: require("../../../assets/doraemon_weaknet.png"),
          platforms: ["ios"],
        },
        {
          text: "接口抓包",
          entryType: "networkInfo",
          routeName: "NetworkInfo",
          icon: require("../../../assets/doraemon_net.png"),
        },
        {
          text: "功能反馈",
          entryType: "feedBack",
          routeName: "FeedBack",
          icon: require("../../../assets/doraemon_mock.png"),
        },
      ],
    ],
  },
  {
    title: "调试能力",
    data: [
      [
        {
          text: "动态调试",
          entryType: "debugBundle",
          routeName: "DebugBundle",
          debugEnable: true,
          icon: require("../../../assets/doraemon_self.png"),
        },
        {
          text: "Reload bundle",
          entryType: "reloadBundle",
          debugEnable: true,
          icon: require("../../../assets/doraemon_kadun.png"),
        },
      ],
    ],
  },
  {
    title: "元素&性能审查",
    data: [
      [
        {
          text: "Inspector",
          entryType: "toggleInspector",
          debugEnable: true,
          icon: require("../../../assets/doraemon_viewmetrics.png"),
        },
        {
          text: "PerfMonitor",
          entryType: "toggleMonitor",
          debugEnable: true,
          icon: require("../../../assets/doraemon_fps.png"),
        },
      ],
    ],
  },
];

const DebugCenter: React.FC = (props: any) => {
  const { navigation } = props;
  const [listArr, setListArr] = useState(dataSource);

  useEffect(() => {
    async function fetchInspectorStatus() {
      try {
        const inspectorIsShown =
          (await XRNDebugTools?.getInspectorIsShown?.()) || false;
        const inPerfMonitorIsShown =
          (await XRNDebugTools?.getPerfMonitorIsShown?.()) || false;
        const updatedDataSource = dataSource.map((section) => ({
          ...section,
          data: section.data.map((group) =>
            group.map((item) => {
              if (item.text === "Inspector" || item.text === "PerfMonitor") {
                return {
                  ...item,
                  text:
                    item.text === "Inspector"
                      ? inspectorIsShown
                        ? "HideInspector"
                        : "ShowInspector"
                      : inPerfMonitorIsShown
                        ? "HidePMonitor"
                        : "ShowPMonitor",
                };
              } else {
                return item;
              }
            }),
          ),
        }));
        setListArr(updatedDataSource);
      } catch (error) {
        console.error("获取 Inspector 状态失败:", error);
      }
    }

    fetchInspectorStatus();
  }, []);

  const _itemClick = (item: DebugCenterSectionItem) => {
    const entryType = item.entryType;

    if (item.routeName) {
      navigation?.navigate(item.routeName);
      return;
    }

    if (entryType === "cleanCache") {
      nativeToast("清理成功");
      XRNDebugTools?.cleanAppCache();
    }

    if (entryType === "appSetting") {
      if (Platform.OS === "android" || Platform.OS === 'harmony') {
        Linking.openSettings();
      } else {
        Linking.openURL("app-settings:");
      }
    }

    if (entryType === "reloadBundle") {
      XRNDebugTools.reloadBundle();
    }

    if (entryType === "toggleInspector") {
      const result = XRNDebugTools?.toggleInspector?.();
      navigation?.goBack?.();
      if (!result) {
        nativeToast("请使用最新的native代码打包");
      }
    }

    if (entryType === "toggleMonitor") {
      const result = XRNDebugTools?.togglePerfMonitor?.();
      navigation?.goBack?.();
      if (!result) {
        nativeToast("请使用最新的native代码打包");
      }
    }
  };

  function isMeetShow(item: DebugCenterSectionItem): boolean {
    if (item.platforms && !item.platforms.includes(Platform.OS)) {
      return false;
    } else if (!__DEV__ && item.debugEnable === true) {
      return false;
    } else if (item.channel && !channelShow.includes(item.channel)) {
      return false;
    } else {
      return true;
    }
  }

  const _renderItem = ({ item }: { item: DebugCenterSectionItem[] }) => {
    return (
      <View style={styles.rowContainer}>
        {item &&
          item.map((itm: DebugCenterSectionItem, index: number) => {
            if (!isMeetShow(itm)) {
              return null;
            }
            return (
              <TouchableOpacity
                accessibilityLabel="21c57ce2"
                key={index}
                style={[styles.item, { width: itemWidth }]}
                onPress={() => _itemClick(itm)}
              >
                <Image style={styles.iconStyle} source={itm.icon} />
                <Text style={styles.itemText}>{itm.text}</Text>
              </TouchableOpacity>
            );
          })}
      </View>
    );
  };

  const _renderSectionHeader = (
    title: string,
    data: DebugCenterSectionItem[][],
  ) => {
    const noItem =
      data[0].filter((item) => {
        return isMeetShow(item);
      }).length === 0;
    if (noItem) {
      return null;
    }
    return (
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>
    );
  };

  const _renderSectionFooiter = (data: DebugCenterSectionItem[][]) => {
    const noItem =
      data[0].filter((item) => {
        return isMeetShow(item);
      }).length === 0;
    if (noItem) {
      return null;
    }
    return <View style={styles.footer} />;
  };

  return (
    <Page title="devtools调试工具" hideHeader translucent>
      <View style={styles.container}>
        <SectionList
          sections={listArr}
          // keyExtractor={(item, index) => item + index}
          renderItem={_renderItem}
          renderSectionHeader={({ section: { title, data } }) =>
            _renderSectionHeader(title, data)
          }
          renderSectionFooter={({ section: { data } }) =>
            _renderSectionFooiter(data)
          }
        />
      </View>
    </Page>
  );
};

export default DebugCenter;
