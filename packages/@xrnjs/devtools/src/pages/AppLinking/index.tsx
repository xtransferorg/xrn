import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  ScrollView
} from "react-native";
import { Page } from "../../components/Page";
import { useNavRightButton } from "../../hooks/navigation";
import Clipboard from "@react-native-clipboard/clipboard";
import styles from "./style";
import { nativeToast } from "../../utils/toast";
import StorageUtil from "../../utils/StorageUtil";
import StorageKeys from "../../constants/StorageKeys";
import { BrowsingHistory } from "./type";
import { ROUTES } from "../..";
import URLParse from "url-parse";
import { navigateBundle } from "../../core/navigate";

const AppLinking: React.FC = (props: any) => {
  const { navigation } = props;
  const textInputRef = useRef<TextInput>(null);
  const [value, onChangeText] = useState<string>("");

  const _copyUrl = useCallback(() => {
    Clipboard.setString(
      "xrn://xrn/v1/sub-bundle/sub-bundle/demo"
    );
    nativeToast("复制成功！");
  }, []);

  const _linkingUrl = () => {
    if (value.includes("xrn://xrn/v1")) {
      _saveUrlToStorage(value);

      const { query } = URLParse(value, true);
      const [bundleName, moduleName, pageName] = parseSchemeURL(value) ?? [];
      navigateBundle(bundleName, moduleName, {
        initialRouteName: pageName,
        initialRouteParams: query,
      });
    } else {
      nativeToast("url 格式不正确！");
    }
  };

  const parseSchemeURL = useCallback((url: string) => {
    const regex = /xrn:\/\/xrn\/v1\/([^\/]+)\/([^\/]+)\/([^\/?]+)/;
    const match = url.match(regex);
    if (match) {
      return [match[1], match[2], match[3]];
    }
    return null;
  }, []);

  const _formatBrowsingHistoryObj = useCallback((url: string) => {
    const parseObj = parseSchemeURL(url);
    if (parseObj) {
      const [bundleName, moduleName, pageName] = parseObj;
      const newHistory: BrowsingHistory = {
        url,
        bundleName,
        moduleName,
        pageName,
        time: new Date().toISOString(),
      };
      return newHistory;
    } else {
      return null;
    }
  }, []);

  const _updateArrayWithNewObj = (
    arr: BrowsingHistory[],
    newHistory: BrowsingHistory
  ): BrowsingHistory[] => {
    const filteredArr = arr.filter((item) => item.url !== newHistory.url);
    return [newHistory, ...filteredArr];
  };

  const _saveUrlToStorage = async (url: string) => {
    const history =
      ((await StorageUtil.getItem(
        StorageKeys.BROWSING_HISTORY
      )) as BrowsingHistory[]) || [];
    if (history) {
      const newHistory = _formatBrowsingHistoryObj(url) as BrowsingHistory;
      const newArr = _updateArrayWithNewObj(history, newHistory);
      StorageUtil.setItem(StorageKeys.BROWSING_HISTORY, newArr);
    } else {
      const newHistory = _formatBrowsingHistoryObj(url);
      StorageUtil.setItem(StorageKeys.BROWSING_HISTORY, [newHistory]);
    }
  };

  const _routeHistory = useCallback(() => {
    navigation?.navigate("SchemeHistory");
  }, []);

  const renderRightButton = () => {
    return (
      <TouchableOpacity
        style={styles.rightBtnBox}
        onPress={() => _routeHistory()}
      >
        <Text style={styles.rightBtnText}>查询记录</Text>
      </TouchableOpacity>
    );
  };

  const rightButton = useNavRightButton(renderRightButton);

  return (
    <Page title="任意门" rightButton={rightButton} hideHeader>
      <ScrollView>
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss}>
          <View style={styles.container}>
            <View style={styles.content}>
              <Text style={styles.tipStyle}>
                请将App落地页对应的scheme url复制到输入框
              </Text>
              <Text style={styles.urlRule}>scheme url拼接规则：</Text>
              <Text style={styles.urlStr}>
              xrn://xrn/v1/bundleName/moduleName/pageName?params
              </Text>
              <Text style={styles.exampleUrl}>url示例 (点击可复制)：</Text>
              <TouchableOpacity onPress={() => _copyUrl()}>
                <Text style={styles.urlStr}>xrn://xrn/v1/sub-bundle/sub-bundle/demo</Text>
              </TouchableOpacity>
              <TextInput
                ref={textInputRef}
                style={styles.inputStyle}
                onChangeText={(text) => onChangeText(text)}
                value={value}
                placeholder="请输入url"
                placeholderTextColor="#B3B2C1"
                multiline
                numberOfLines={0}
              />
              <TouchableOpacity
                accessibilityLabel="confirm.75d69171"
                style={styles.confirm}
                onPress={() => _linkingUrl()}
              >
                <Text style={styles.confirmText}>跳转</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </ScrollView>
    </Page>
  );
};

export default AppLinking;
