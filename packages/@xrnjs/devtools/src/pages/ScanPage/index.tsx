import React, { useEffect, useRef, useState } from "react";
import { Animated, Text, View, NativeModules, Platform } from "react-native";
import {
  Camera,
  useCameraDevice,
  useCameraFormat,
  useCameraPermission,
  useCodeScanner,
} from "react-native-vision-camera";
import { Page } from "../../components/Page";
import { finishBundle } from "../../core/navigate";
import parse from "url-parse";
import { nativeToast } from "../../utils/toast";
import styles from "./style";
import { ROUTES } from "../..";
import DeviceInfo from "react-native-device-info";
import { XRNNativeStorage } from "@xrnjs/native-storage";
import { setItemSync } from "../../utils/storage";
import { XRNAppUtils } from "@xrnjs/app-utils";
import { bundleList } from "../../utils/bundleManager";

const XRNDebugToolsModule = NativeModules?.XRNDebugToolsModule;

enum ScanScene {
  visual = "visual",
}

export enum CameraStatus {
  READY = "READY",
  PENDING_AUTHORIZATION = "PENDING_AUTHORIZATION",
  NOT_AUTHORIZED = "NOT_AUTHORIZED",
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

      if (Array.isArray(codes)) {
        const item = codes[0];
        const value = item.value;
        const valObj = JSON.parse(value);
        const action = valObj.action;
        if (action === "action_set_bundle_host") {
          scanStatus.current = true;

          const content = valObj.content;
          const { port, hostname } = parse(content, true);
          setBundleHostIP(hostname);
          const list = await bundleList();
          const bundleName = list.find(
            (item) => item.port === port,
          )?.bundleName;
          console.log("动态调试bundleName：", bundleName);

          if (Platform.OS === "android") {
            XRNDebugToolsModule?.setBundleDebugSync?.(bundleName, true);
          } else {
            setItemSync("spUtils", `${bundleName}-debug`, "1");
          }

          nativeToast("ip地址绑定成功，重启APP生效！");
          console.log("识别成功！");

          setTimeout(() => {
            XRNAppUtils?.exitApp?.();
          }, 2000);
          return;
        }
      }
    },
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

  if (!device) {
    return <NotAuthorizedView />;
  }

  return (
    <Page title="扫描二维码" hideHeader>
      <View style={styles.container}>
        <Camera
          style={[styles.camera]}
          device={device}
          isActive={true}
          photo={false}
          video={false}
          codeScanner={codeScanner}
          onError={(error: any) => {
            console.log("error", error);
          }}
        ></Camera>
      </View>
    </Page>
  );
};

export default ScanQRPage;
