import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  ScrollView,
  Image,
  Share,
  Modal,
} from "react-native";
import DeviceInfoModule from "react-native-device-info";
import { Platform } from "@xrnjs/modules-core";
import { Page } from "../../components/Page";
import styles from "./style";
import { ROUTES } from "../..";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import RadarAnimation from "./RadarAnimation";
import { DNSItem, NetDiagnosisInfo, PingItem, ProxyItem } from "./type";
import { fetch } from "@react-native-community/netinfo";
import env from "react-native-config";
import Clipboard from "@react-native-clipboard/clipboard";
import { XRNDebugTools } from "@xrnjs/debug-tools";
import { nativeToast } from "../../utils/toast";

const defaultNetDiagnosisInfo: NetDiagnosisInfo = {
  appVersion: DeviceInfoModule.getVersion(),
  sysVersion: DeviceInfoModule.getSystemVersion(),
  netType: "未知",
  netStatus: "网络不可用",
  netProxy: {
    ip: "",
    port: "",
    type: "",
  },
  ping: {
    baiduPing: {
      host: "www.baidu.com",
      time: "",
    },
    aliyunPing: {
      host: "www.aliyun.com",
      time: "",
    },
  },
  DNS: {
    host: "www.aliyun.com",
    ip: "未知",
  },
};

const NetworkDiagnosis: React.FC = (props: any) => {
  const { navigation } = props;
  const insets = useSafeAreaInsets();
  const [diagnosisData, setDiagnosisData] = useState<NetDiagnosisInfo>(
    defaultNetDiagnosisInfo,
  );
  const [isDiagnosing, setIsDiagnosing] = useState(false);

  const _diagnosisStart = async () => {
    setIsDiagnosing(true);

    const appVersion = DeviceInfoModule.getVersion();
    const sysVersion = DeviceInfoModule.getSystemVersion();
    const { type, isConnected, isInternetReachable } = await fetch();
    const netReachable =
      Platform.OS === "android" ? isInternetReachable : isConnected;
    const connect = netReachable ? "网络可用" : "网络不可用";

    const netProxy = ((await XRNDebugTools?.proxyInfo?.(
      "https://www.baidu.com",
    )) as ProxyItem) || { ip: "", port: "", type: "" };
    const baiduPing = ((await XRNDebugTools?.pingStart?.(
      "www.baidu.com",
    )) as PingItem) || { host: "www.baidu.com", time: "0" };
    const aliyunPing = ((await XRNDebugTools?.pingStart?.(
      "www.aliyun.com",
    )) as PingItem) || { host: "www.aliyun.com", time: "0" };
    const ndsResult = ((await XRNDebugTools?.dnsStart?.(
      "www.baidu.com",
    )) as DNSItem) || { host: "www.baidu.com", ip: "未知" };

    setIsDiagnosing(false);
    const result: NetDiagnosisInfo = {
      appVersion,
      sysVersion,
      netType: type,
      netStatus: connect,
      netProxy,
      ping: {
        baiduPing,
        aliyunPing,
      },
      DNS: ndsResult,
    };

    setDiagnosisData(result);
  };

  useEffect(() => {
    _diagnosisStart();
  }, []);

  const _back = useCallback(() => {
    navigation?.goBack?.();
  }, []);

  const _retryDiagnosis = useCallback(() => {
    setDiagnosisData(defaultNetDiagnosisInfo);
    _diagnosisStart();
  }, []);

  const _copyLog = useCallback(() => {
    const result = JSON.stringify(diagnosisData);
    Clipboard.setString(result);
    // Share.share({ message: result });
    nativeToast("复制成功");
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.contentBox}>
        <View style={styles.gradientBox}>
          {diagnosisData.netStatus === "网络不可用" ? (
            <View style={[styles.bgTipBox, { backgroundColor: "#EA3841" }]}>
              <Text style={styles.statusText}>
                {isDiagnosing ? "诊断中" : "网络连接异常"}
              </Text>
              <Text style={styles.tip}>若任然无法连接到网络，请联系开发</Text>
            </View>
          ) : (
            <View style={[styles.bgTipBox, { backgroundColor: "#3AA94D" }]}>
              <Text style={styles.statusText}>网络连接正常</Text>
              <Text style={styles.tip}>若任然无法连接到网络，请联系开发</Text>
            </View>
          )}
        </View>
        <View style={styles.infoBox}>
          <View style={styles.baseInfo}>
            <View style={styles.titleBox}>
              <Text style={styles.baseTitle}>基本信息</Text>
            </View>
            <Text
              style={styles.version}
            >{`app版本：${diagnosisData?.appVersion}`}</Text>
            <Text
              style={styles.sysVersion}
            >{`系统版本：${diagnosisData?.sysVersion}`}</Text>
            <Text style={styles.sysVersion}>{`环境：${env.ENV_NAME}`}</Text>
          </View>
          <View style={styles.baseInfo}>
            <View style={styles.titleBox}>
              <Text style={styles.baseTitle}>网络状态</Text>
              <Image
                style={styles.statusIcon}
                source={
                  diagnosisData?.netStatus === "网络可用"
                    ? require("../../../assets/images/success_icon.png")
                    : require("../../../assets/images/fail_icon.png")
                }
              />
            </View>
            <Text
              style={styles.version}
            >{`${diagnosisData?.netType} ${diagnosisData?.netStatus}`}</Text>
          </View>
          {Platform.OS === "android" || Platform.OS === "harmony" ? (
            <View></View>
          ) : (
            <View>
              <View style={styles.baseInfo}>
                <View style={styles.titleBox}>
                  <Text style={styles.baseTitle}>网络代理</Text>
                </View>
                {diagnosisData?.netProxy?.ip ? (
                  <View style={styles.proxyBox}>
                    <Text
                      style={styles.version}
                    >{`ip：${diagnosisData?.netProxy?.ip}`}</Text>
                    <Text
                      style={styles.version}
                    >{`port：${diagnosisData?.netProxy?.port}`}</Text>
                  </View>
                ) : (
                  <Text style={styles.version}>未设置代理</Text>
                )}
              </View>
              <View style={styles.baseInfo}>
                <Text style={styles.baseTitle}>Ping</Text>
                <View style={styles.pingBox}>
                  <Text
                    style={styles.version}
                  >{`${diagnosisData?.ping?.baiduPing?.host}：${diagnosisData?.ping?.baiduPing?.time}`}</Text>
                  <Image
                    style={styles.statusIcon}
                    source={
                      parseFloat(
                        diagnosisData?.ping?.baiduPing?.time as string,
                      ) > 0
                        ? require("../../../assets/images/success_icon.png")
                        : require("../../../assets/images/fail_icon.png")
                    }
                  />
                </View>
                <View style={styles.pingBox}>
                  <Text
                    style={styles.version}
                  >{`${diagnosisData?.ping?.aliyunPing?.host}：${diagnosisData?.ping?.aliyunPing?.time}`}</Text>
                  <Image
                    style={styles.statusIcon}
                    source={
                      parseFloat(
                        diagnosisData?.ping?.aliyunPing?.time as string,
                      ) > 0
                        ? require("../../../assets/images/success_icon.png")
                        : require("../../../assets/images/fail_icon.png")
                    }
                  />
                </View>
              </View>
              <View style={styles.baseInfo}>
                <View style={styles.titleBox}>
                  <Text style={styles.baseTitle}>DNS</Text>
                  <Image
                    style={styles.statusIcon}
                    source={
                      diagnosisData?.DNS?.ip === "未知"
                        ? require("../../../assets/images/fail_icon.png")
                        : require("../../../assets/images/success_icon.png")
                    }
                  />
                </View>
                <Text
                  style={styles.version}
                >{`${diagnosisData?.DNS?.host}：${diagnosisData.DNS?.ip}`}</Text>
              </View>
            </View>
          )}
          <View style={styles.bottomBox}>
            <TouchableOpacity
              style={styles.reCheckBox}
              onPress={() => _retryDiagnosis()}
            >
              <Text style={styles.retryText}>重新诊断</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.reCheckBox}
              onPress={() => _copyLog()}
            >
              <Text style={styles.retryText}>复制日志</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      <View style={[styles.navBox, { top: insets.top }]}>
        <TouchableOpacity style={styles.leftBtn} onPress={() => _back()}>
          <Image
            style={styles.backIcon}
            source={require("../../../assets/images/reback-white-icon.png")}
          />
        </TouchableOpacity>
        <Text style={styles.navTitle}>网络诊断</Text>
        <View style={styles.rightBtn} />
      </View>
      <Modal visible={isDiagnosing} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <RadarAnimation />
        </View>
      </Modal>
    </View>
  );
};

export default NetworkDiagnosis;
