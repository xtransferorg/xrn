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
import {
  sensorsFundClick,
  sensorsFundPageView,
} from "../../utils/sensorsTrack";
import { ROUTES } from "../..";
import URLParse from "url-parse";
import { navigateBundle } from "../../core/navigate";

const AppLinking: React.FC = (props: any) => {
  const { navigation } = props;
  const textInputRef = useRef<TextInput>(null);
  const [value, onChangeText] = useState<string>("");

  useEffect(() => {
    sensorsFundPageView({ module_name: `devtools_${ROUTES.AppLinking}` });
  }, []);

  const _copyUrl = useCallback(() => {
    Clipboard.setString(
      "xtransfer://xtransfer/v1/xt-app-fund/Exchange/FxRate?where=widget_trend_medium&baseCurrency=USD&targetCurrency=CNY&type=DAY"
    );
    nativeToast("复制成功！");
    sensorsFundClick({
      button_name: "devtools_btn_click",
      devtools_click_btn_name: "任意门 复制url",
    });
  }, []);

  const _linkingUrl = () => {
    if (value.includes("xtransfer://xtransfer/v1")) {
      _saveUrlToStorage(value);

      const { query } = URLParse(value, true);
      const [bundleName, moduleName, pageName] = parseXTransferURL(value) ?? [];
      navigateBundle(bundleName, moduleName, {
        initialRouteName: pageName,
        initialRouteParams: query,
      });
      sensorsFundClick({
        button_name: "devtools_btn_click",
        devtools_click_btn_name: "任意门 openUrl",
      });
    } else {
      nativeToast("url 格式不正确！");
    }
  };

  const parseXTransferURL = useCallback((url: string) => {
    const regex = /xtransfer:\/\/xtransfer\/v1\/([^\/]+)\/([^\/]+)\/([^\/?]+)/;
    const match = url.match(regex);
    if (match) {
      return [match[1], match[2], match[3]];
    }
    return null;
  }, []);

  const _formatBrowsingHistoryObj = useCallback((url: string) => {
    const parseObj = parseXTransferURL(url);
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
    sensorsFundClick({
      button_name: "devtools_btn_click",
      devtools_click_btn_name: "任意门 跳转历史搜索列表",
    });
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
    <Page title="任意门" rightButton={rightButton}>
      <ScrollView>
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss}>
          <View style={styles.container}>
            <View style={styles.content}>
              <Text style={styles.tipStyle}>
                请将App落地页对应的scheme url复制到输入框
              </Text>
              <Text style={styles.urlRule}>scheme url拼接规则：</Text>
              <Text style={styles.urlStr}>
                xtransfer://xtransfer/v1/bundleName/moduleName/pageName?params
              </Text>
              <Text style={styles.exampleUrl}>url示例 (点击可复制)：</Text>
              <TouchableOpacity onPress={() => _copyUrl()}>
                <Text style={styles.urlStr}>
                  xtransfer://xtransfer/v1/xt-app-fund/Exchange/FxRate?where=widget_trend_medium&baseCurrency=USD&targetCurrency=CNY&type=DAY
                </Text>
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
