import React, { useEffect, useRef, useState } from "react";
import { Animated, Text, View, NativeModules, Platform } from "react-native";
import {
  Camera,
  useCameraDevice,
  useCameraFormat,
  useCameraPermission,
  useCodeScanner
} from "react-native-vision-camera";
import LinearGradient from "react-native-linear-gradient";
import { Page } from "../../components/Page";
import { finishBundle } from "../../core/navigate";
import parse from "url-parse";
import { nativeToast } from "../../utils/toast";
import styles from "./style";
import { sensorsFundPageView } from "../../utils/sensorsTrack";
import { ROUTES } from "../..";
import DeviceInfo from "react-native-device-info";
import { XRNNativeStorage } from "@xrnjs/native-storage";
import { setItemSync } from "../../utils/storage";
import { XRNAppUtils } from "@xrnjs/app-utils";
import { bundleList } from "../../utils/bundleManager";
import { XRNDebugToolsModule } from '@xrnjs/debug-tools'

enum ScanScene {
  visual = "visual"
}

export enum CameraStatus {
  READY = "READY",
  PENDING_AUTHORIZATION = "PENDING_AUTHORIZATION",
  NOT_AUTHORIZED = "NOT_AUTHORIZED"
}

const NotAuthorizedView = (props: any) => {
  const { navigation } = props;
  return (
    <View>
      <Text>暂未开启相机权限</Text>
    </View>
  );
};

const ScanQRPage: React.FC = (props: any) => {
  const { navigation } = props;
  const scanStatus = useRef(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const isEmulator = DeviceInfo.isEmulatorSync();
  const device = useCameraDevice("back");

  const codeScanner = useCodeScanner({
    codeTypes: ["qr", "ean-13"],
    onCodeScanned: async (codes: any) => {
      if (scanStatus.current) return;

      console.log("codeScanner", JSON.stringify(codes));

      // 处理扫码绑定IP
      if (Array.isArray(codes)) {
        const item = codes[0];
        const value = item?.value;
        if (typeof value === "string" && value.includes("visual")) {
          // 多语言可视化扫描
          barCodeRead(value);
        } else {
          // 扫描调试
          const valObj = JSON.parse(value);
          const action = valObj.action;
          if (action === "action_set_bundle_host") {
            scanStatus.current = true;

            const content = valObj.content;
            const scanBundleName = valObj.bundle_name;
            const { port, hostname } = parse(content, true);
            console.log("解析结果：", content, port, hostname, scanBundleName);
            // 绑定ip地址
            setBundleHostIP(hostname);

            if (!scanBundleName) {
              nativeToast("二维码中不存在bundleName!");
              return;
            }
            XRNDebugToolsModule?.registerDevBundle?.(scanBundleName, port);

            // 绑定调试bundle
            nativeToast("ip地址绑定成功，重启APP生效！");
            console.log("识别成功！");

            setTimeout(() => {
              XRNAppUtils?.exitApp?.();
            }, 2000);
          }
        }
      } else {
        nativeToast("二维码格式不正确！");
      }
    }
  });

  function setBundleHostIP(ip: string) {
    if (Platform.OS === "android") {
      XRNDebugToolsModule?.setBundleHostIP?.(ip);
    } else if (!isEmulator && Platform.OS === "ios") {
      XRNNativeStorage?.setItemSync?.("RCT_jsLocation", ip);
    }
  }

  const { hasPermission, requestPermission } = useCameraPermission();

  if (!hasPermission) {
    requestPermission();
  }

  useEffect(() => {
    sensorsFundPageView({ module_name: `devtools_${ROUTES.ScanQRPage}` });
  }, []);

  useEffect(() => {
    Animated.loop(
      Animated.timing(fadeAnim, {
        toValue: 218,
        duration: 3000,
        useNativeDriver: true
      })
    ).start();
  }, []);

  const barCodeRead = (value: string) => {
    if (scanStatus.current) return;
    console.log("扫描结果：", value);
    const { host, query, port } = parse(value, true);
    const { usage } = query || {};
    if (usage === ScanScene.visual) {
      // 多语言可视化扫描
      scanStatus.current = true;
      XRNDebugToolsModule?.openConnection?.(host, port, query?.room || "");
      nativeToast("扫描成功");
      navigation?.pop(2);
      // finishBundle();
    } else {
      nativeToast("不支持的二维码");
      scanStatus.current = true;
    }
  };

  if (!device) {
    return <NotAuthorizedView />;
  }

  return (
    <Page title="扫描二维码">
      <View style={styles.container}>
        {hasPermission && device && (
          <Camera
            style={[styles.camera]}
            device={device}
            isActive
            photo={false}
            video={false}
            codeScanner={codeScanner}
            onError={(error: any) => {
              console.log("error", error);
            }}
          >
            <View style={[styles.rectWrap]}>
              <View style={styles.rectTop} />
              <View style={[styles.mid]}>
                <View style={styles.scanArea} />
                <View style={[styles.rect]}>
                  <View style={[styles.corner, styles.lt]} />
                  <View style={[styles.corner, styles.rt]} />
                  <View style={[styles.corner, styles.lb]} />
                  <View style={[styles.corner, styles.rb]} />
                  <Animated.View
                    style={{
                      transform: [
                        {
                          translateY: fadeAnim
                        }
                      ]
                    }}
                  >
                    <LinearGradient
                      start={{
                        x: 0,
                        y: 0
                      }}
                      end={{
                        x: 1,
                        y: 0
                      }}
                      colors={["#FF934A50", "#FF934A", "#FF934A50"]}
                      style={styles.line}
                    />
                  </Animated.View>
                </View>
                <View style={styles.scanArea} />
              </View>
              <View style={styles.tipsWrap}>
                <Text style={styles.tips}>将二维码放入框内即可自动扫描</Text>
              </View>
            </View>
          </Camera>
        )}
      </View>
    </Page>
  );
};

export default ScanQRPage;
