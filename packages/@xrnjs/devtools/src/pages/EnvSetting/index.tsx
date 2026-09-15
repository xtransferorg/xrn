import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import env from "react-native-config";
import { XRNAppUtils } from "@xrnjs/app-utils";

import styles from "./style";
import { ROUTES } from "../..";
import { ResetCodePushKey } from "./ResetCodePushKey";
import { Page } from "../../components/Page";
import {
  sensorsFundClick,
  sensorsFundPageView,
} from "../../utils/sensorsTrack";
import { getItemSync } from "../../utils/storage";
import { nativeToast } from "../../utils/toast";

const DevSetting: React.FC = () => {
  const envUrl = env.ENV_NAME || "";
  const apiHost = getItemSync("spUtils", "DEV_ENV_NAME") || envUrl;
  const textInputRef = useRef<TextInput>(null);
  console.log(`apiHost=${apiHost}`);
  const [value, onChangeText] = useState<string>(apiHost);
  console.log(`value=${value}`);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [loading, setLoading] = useState(false);

  if (value === "prod") {
    nativeToast("不允许手动设置prod环境哦~");
  }

  useEffect(() => {
    sensorsFundPageView({ module_name: `devtools_${ROUTES.EnvSetting}` });
  }, []);

  useEffect(() => {
    setTimeout(() => {
      const position = _findFirstAndLastNumberPosition(value);
      // console.log(`postion, start=${position.start}, end=${position.end}`);
      if (position.start === -1 && position.end === -1) {
        setSelection({ start: value.length, end: value.length });
      } else {
        setSelection({ start: position.start, end: position.end + 1 });
      }
    }, 500);
  }, []);

  // 计算url字符串中环境数字出现的位置
  const _findFirstAndLastNumberPosition = (
    envName: string,
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

  const _confirmClick = async () => {
    if (value === "prod") {
      nativeToast("不允许手动设置prod环境哦~");
      return;
    }

    try {
      setLoading(true);
      await ResetCodePushKey(value);

      nativeToast(`环境切换成功，重新APP后生效~`);
      setTimeout(() => {
        XRNAppUtils.exitApp();
      }, 3000);
    } catch (error) {
      console.log("ResetCodePushKey failed:", error);
    } finally {
      setLoading(false);
    }

    sensorsFundClick({
      button_name: "devtools_btn_click",
      devtools_click_btn_name: "设置环境页 保存并重启",
    });
  };

  return (
    <Page title="设置环境">
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
    </Page>
  );
};

export default DevSetting;
