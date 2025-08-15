import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import env from "react-native-config";
import { XRNAppUtils } from "@xrnjs/app-utils";
import { Page } from "../../components/Page";
import RequestManager from "./Network";
import styles from "./style";
import { getItemSync, setItemSync } from "../../utils/storage";
import XTToast from "../../components/XTToast";
import { ROUTES } from "../..";
import { bundleList } from "../../utils/bundleManager";

const platform = Platform.OS;

const DevSetting: React.FC = () => {
  const envUrl = env.ENV_NAME || "";
  const apiHost = getItemSync("spUtils", "DEV_ENV_NAME") || envUrl;
  const textInputRef = useRef<TextInput>(null);
  console.log(`apiHost=${apiHost}`);
  const [value, onChangeText] = useState<string>(apiHost);
  console.log(`value=${value}`);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [loading, setLoading] = useState(false);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg: string, duration = 3000) => {
    setToastMsg(msg);
    setToastVisible(true);
  };

  useEffect(() => {
    setTimeout(() => {
      const position = _findFirstAndLastNumberPosition(value);
      console.log(`postion, start=${position.start}, end=${position.end}`);
      if (position.start === -1 && position.end === -1) {
        setSelection({ start: value.length, end: value.length });
      } else {
        setSelection({ start: position.start, end: position.end + 1 });
      }
    }, 500);
  }, []);

  const _findFirstAndLastNumberPosition = (
    envName: string
  ): { start: number; end: number } => {
    let firstIndex: number | null = null;
    let lastIndex: number | null = null;

    for (let i = 0; i < envName.length; i++) {
      if (/\d/.test(envName[i])) {
        if (firstIndex === null) {
          firstIndex = i;
        }
        lastIndex = i;
      }
    }

    if (firstIndex !== null && lastIndex !== null) {
      return { start: firstIndex, end: lastIndex };
    }

    return { start: -1, end: -1 };
  };

  const _confirmClick = () => {
    setItemSync("spUtils", "DEV_ENV_NAME", value);

    // 切换codepush
    _changeCodePushDevelopmentKey();
  };

  const _parseEnv = (envName: string): string | null => {
    if (envName.startsWith("api-")) {
      return envName.slice(4);
    }
    return envName;
  };

  const _parseCodePushDevelopmentKey = (data: any): string | undefined => {
    return data?.deployments?.[0]?.key;
  };

  const _changeCodePushDevelopmentKey = async () => {
    setLoading(true);
    const bundles = await bundleList();
    const env = _parseEnv(value);
    const urls = bundles.map((item: any) => {
      const url = `http://cp.xxxx/apps/${item?.bundleName}-${platform}-${env}/deployments/`;
      return url;
    });

    const manager = new RequestManager(1, 5000);
    try {
      const results = await manager.executeRequests(urls);
      setLoading(false);

      for (let index = 0; index < bundles.length; index++) {
        const element = bundles[index];
        const requestRes = results[index];

        if (!__DEV__) {
          if (requestRes?.data?.error === "406") {
            showToast(`${env}环境的codepush key未创建！`)
            return;
          } else if (requestRes?.data?.error) {
            showToast(`请求${env}环境的codepush key失败`)
            return;
          }
        }

        const developmentKey = _parseCodePushDevelopmentKey(requestRes?.data) || "";
        console.log(`developmentKey：${element?.bundleName}`, developmentKey);
        setItemSync(
          "dev_support",
          `${element?.bundleName}-codepush-key`,
          developmentKey,
        );
      }

      showToast(`环境切换成功，重新APP后生效~`)
      setTimeout(() => {
        XRNAppUtils.exitApp();
      }, 3000);
    } catch (error) {
      setLoading(false);
      console.error("Error during requests:", error);
    }
  };

  return (
    <Page title="设置环境" hideHeader>
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.tipStyle}>设置环境，不需要带api-</Text>
          <TextInput
            ref={textInputRef}
            style={styles.inputStyle}
            onSelectionChange={(event) => {
              const { start, end } = event.nativeEvent.selection;
              setSelection({ start, end });
            }}
            onChangeText={(text) => onChangeText(text)}
            value={value}
            placeholder="请输入环境"
            placeholderTextColor="#666"
            textContentType="URL"
            returnKeyType="done"
            autoFocus
            selectionColor="red"
            selection={selection}
          />
          <TouchableOpacity
            accessibilityLabel="confirm.75d69171"
            style={styles.confirm}
            onPress={() => _confirmClick()}
          >
            <Text style={styles.confirmText}>保存并重启APP</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Modal transparent visible={loading}>
        <View style={styles.modalContent}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="orange" />
          </View>
        </View>
      </Modal>
      <XTToast
        visible={toastVisible}
        message={toastMsg}
        duration={3000}
        onClose={() => setToastVisible(false)}
      />
    </Page>
  );
};

export default DevSetting;
