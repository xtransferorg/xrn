import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  View,
  Text,
  TouchableOpacity,
  Linking,
  Share,
} from "react-native";
import { Page } from "../../../components/Page";
import { useNavRightButton } from "../../../hooks/navigation";
import Clipboard from "@react-native-clipboard/clipboard";
import URLParse from "url-parse";

import styles from "./HistoryStyle";
import { BrowsingHistory } from "../type";
import StorageUtil from "../../../utils/StorageUtil";
import StorageKeys from "../../../constants/StorageKeys";
import { ROUTES } from "../../..";
import { navigateBundle } from "../../../core/navigate";
import { nativeToast } from "../../../utils/toast";

const SchemeHistory: React.FC = () => {
  const infoList: BrowsingHistory[] = [];
  const [history, setHistory] = useState<BrowsingHistory[]>(infoList);

  useEffect(() => {
    _fetchHistoryList();
  }, []);

  const _fetchHistoryList = async () => {
    try {
      const jsonVal = (await StorageUtil.getItem(
        StorageKeys.BROWSING_HISTORY
      )) as BrowsingHistory[];
      setHistory(jsonVal);
    } catch (error) {
      console.error("读取失败:", error);
    }
  };

  const _cleanHistory = async () => {
    await StorageUtil.removeItem(StorageKeys.BROWSING_HISTORY);
    setHistory([]);
  };

  const _copyUrl = useCallback((url: string) => {
    Clipboard.setString(url);
    // Share.share({ message: url });
    nativeToast("复制成功");
  }, []);

  const _openUrl = useCallback((item: BrowsingHistory) => {
    const { query } = URLParse(item.url, true);
    navigateBundle(item.bundleName, item.moduleName, {
      initialRouteName: item.pageName,
      initialRouteParams: query,
    });
  }, []);

  const renderRightButton = () => {
    return (
      <TouchableOpacity
        style={styles.rightBtnBox}
        onPress={() => _cleanHistory()}
      >
        <Text style={styles.rightBtnText}>清空记录</Text>
      </TouchableOpacity>
    );
  };

  const rightButton = useNavRightButton(renderRightButton);

  const _listHeader = () => {
    return (
      <View style={styles.headerStyle}>
        <Text style={styles.headerText}>任意门路由查询列表</Text>
        <Text style={styles.subTitle}>(保留最近20条访问记录)</Text>
      </View>
    );
  };

  const _renderItem = ({
    item,
    index,
  }: {
    item: BrowsingHistory;
    index: number;
  }) => {
    return (
      <View style={styles.itemContainer}>
        <View style={styles.infoStyle}>
          <Text style={styles.infoText}>{item.bundleName}</Text>
          <Text style={styles.infoText}>{item.moduleName}</Text>
          <Text style={styles.infoText}>{item.pageName}</Text>
        </View>
        {/* <Text>{`访问时间：${item.time}`}</Text> */}
        <Text style={styles.urlText}>{`任意门url：${item.url}`}</Text>
        <View style={styles.btnBox}>
          <TouchableOpacity
            style={styles.copyUrlBox}
            onPress={() => _copyUrl(item.url)}
          >
            <Text style={styles.copyText}>复制url</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.openUrlBox}
            onPress={() => _openUrl(item)}
          >
            <Text style={styles.openText}>跳转</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <Page title="任意门查询历史" rightButton={rightButton} hideHeader>
      <View style={styles.containerStyle}>
        <FlatList
          data={history}
          renderItem={_renderItem}
          // keyExtractor={(item) => item.title}
          ListHeaderComponent={_listHeader}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>暂无数据</Text>
            </View>
          }
        />
      </View>
    </Page>
  );
};

export default SchemeHistory;
