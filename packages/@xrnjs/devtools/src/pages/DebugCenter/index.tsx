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
import { useNavRightButton } from "../../hooks/navigation";
import { navigateBundle } from "../../core/navigate";
import { sensorsFundPageView, sensorsFundClick } from "../../utils/sensorsTrack";
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
        // {
        //   text: "devtools文档",
        //   entryType: "devtoolsDoc",
        //   debugEnable: true,
        //   icon: require("../../../assets/doraemon_time_profiler.png"),
        //   url: "https://xtransferorg.github.io/guides/debugging/debug-panel/debug-panel",
        // },
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
          platforms: ["ios"],
          icon: require("../../../assets/doraemon_weaknet.png"),
        },
        {
          text: "接口抓包",
          entryType: "networkInfo",
          routeName: "NetworkInfo",
          icon: require("../../../assets/doraemon_net.png"),
        },
      ],
    ],
  },
  {
    title: "调试能力",
    data: [
      [
        {
          text: "Bundle 调试",
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
        {
          text: "MemoryLeak",
          entryType: "toggleMemoryLeak",
          debugEnable: true,
          icon: require("../../../assets/doraemon_memory_leak.png"),
        },
        // {
        //   text: "取色器",
        //   routeName: 'D',
        //   icon: require('./assets/doraemon_straw.png')
        // },
        // {
        //   text: "对齐标尺",
        //   routeName: 'D',
        //   icon: require('./assets/doraemon_align.png')
        // },
        // {
        //   text: "布局边框",
        //   routeName: 'D',
        //   icon: require('./assets/doraemon_viewmetrics.png')
        // }
      ],
    ],
  },
  // {
  //   title: "内存",
  //   data: [
  //     [
  //       {
  //         text: "内存测试信息",
  //         entryType: "memoryTest",
  //         icon: require("../../../assets/doraemon_memory.png"),
  //         platforms: ["ios"],
  //       },
  //       {
  //         text: "加500M内存",
  //         entryType: "memoryAdd",
  //         icon: require("../../../assets/doraemon_memory_leak.png"),
  //         platforms: ["ios"],
  //       },
  //     ],
  //   ],
  // },
  // {
  //   title: "性能检测",
  //   data: [
  //     [
  //       {
  //         text: "帧率",
  //         routeName: 'C',
  //         icon: require('./assets/doraemon_fps.png')
  //       },
  //       {
  //         text: "CPU",
  //         routeName: 'C',
  //         icon: require('./assets/doraemon_cpu.png')
  //       },
  //       {
  //         text: "内存",
  //         routeName: 'C',
  //         icon: require('./assets/doraemon_crash.png')
  //       },
  //       {
  //         text: "网络",
  //         routeName: 'C',
  //         icon: require('./assets/doraemon_net.png')
  //       },
  //       {
  //         text: "模拟弱网",
  //         routeName: 'C',
  //         icon: require('./assets/doraemon_weaknet.png')
  //       },
  //     ]
  //   ]
  // },
];

const DebugCenter: React.FC = (props: any) => {
  const { navigation } = props;
  const [listArr, setListArr] = useState(dataSource);

  useEffect(() => {
    sensorsFundPageView({ module_name: `devtools_${ROUTES.DebugCenter}` });
  }, []);

  useEffect(() => {
    async function fetchInspectorStatus() {
      try {
        // 获取当前Inspector状态，然后刷新文案
        const inspectorIsShown =
          (await XRNDebugTools?.getInspectorIsShown?.()) || false;
        // 获取当前PerfMonitor选中状态
        const inPerfMonitorIsShown =
          (await XRNDebugTools?.getPerfMonitorIsShown?.()) || false;
        // 获取当前MemoryLeak选中状态
        const memoryLeakIsShown =
          (await (XRNDebugTools as any)?.getMemoryLeakIsShown?.()) || false;
        const updatedDataSource = dataSource.map((section) => ({
          ...section,
          data: section.data.map((group) =>
            group.map((item) => {
              if (
                item.text === "Inspector" ||
                item.text === "PerfMonitor" ||
                item.text === "MemoryLeak"
              ) {
                return {
                  ...item,
                  text:
                    item.text === "Inspector"
                      ? inspectorIsShown
                        ? "HideInspector"
                        : "ShowInspector"
                      : item.text === "PerfMonitor"
                        ? inPerfMonitorIsShown
                          ? "HidePMonitor"
                          : "ShowPMonitor"
                        : memoryLeakIsShown
                          ? "EndMemLeak"
                          : "StartMemLeak",
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
    // devtools功能入口埋点
    sensorsFundClick({ button_name: 'devtools_btn_click', devtools_click_btn_name: `debugCenter ${item.text} 功能入口点击` });

    // 存在二级页面，则直接navigation跳转到二级页面
    if (item.routeName) {
      navigation?.navigate(item.routeName);
      return;
    }

    if (entryType === "cleanCache") {
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

    if (entryType === "memoryTest") {
      // XRNDebugTools?.memoryTest();
    }

    if (entryType === "memoryAdd") {
      nativeToast("添加成功");
      // DebugPanelModule?.memoryAdd();
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

    if (entryType === "toggleMemoryLeak") {
      const result = XRNDebugTools?.toggleMemoryLeak?.();
      console.log('toggleMemoryLeak', result);
      navigation?.goBack?.();
      if (!result) {
        nativeToast("请使用最新的native代码打包");
      }
    }

    if (entryType === "mockCrash") {
      XRNDebugTools?.nativeCrash?.();
    }

    if (entryType === "xtdBundle") {
      navigateBundle("xt-package-xrn", "Main");
    }

    if (entryType === "businessBundle") {
      navigateBundle("@xrnjs/ui-business-example", "BusinessComponent");
    }

    if (entryType === "devtoolsDoc") {
      openURLInBrowser(item.url);
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

  const _pushFeedBack = useCallback(() => {
    navigation.navigate("FeedBack");
    sensorsFundClick({ button_name: 'devtools_btn_click', devtools_click_btn_name: `debugCenter 反馈按钮点击` });
  }, []);

  const renderRightButton = () => {
    return (
      <TouchableOpacity
        style={styles.rightBtnBox}
        onPress={() => _pushFeedBack()}
      >
        <Text style={styles.rightBtnText}>反馈</Text>
      </TouchableOpacity>
    );
  };

  const rightButton = useNavRightButton(renderRightButton);

  return (
    <Page title="@xrnjs/devtools" rightButton={rightButton}>
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
