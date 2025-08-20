import React, { useCallback, useEffect, useState } from "react";
import { FlatList, View, Text, TouchableOpacity } from "react-native";
import { nativeToast } from "../../utils/toast";
import Clipboard from "@react-native-clipboard/clipboard";
import { Page } from "../../components/Page";
import { useNavRightButton } from "../../hooks/navigation";
import { Navigation } from "@xrnjs/navigation";

import styles from "./style";
import { RouteItem } from "./type";
import { ROUTES } from "../..";
import { XRNDebugTools } from '@xrnjs/debug-tools'

const RouteInfo: React.FC = () => {
  const infoList: RouteItem[] = [];
  const [data, setData] = useState<RouteItem[]>(infoList);

  useEffect(() => {
    XRNDebugTools?.routeInfo?.().then((res) => {
      const newArr = (res as RouteItem[]).reverse();
      setData(newArr);
    });
  }, []);

  const _copyRouteInfo = (
    index: number,
    bundleName: string,
    moduleName: string,
  ) => {
    if (index === 0) {
      const schemeUrl = getSchemeUrl(bundleName, moduleName);
      console.log("schemeUrl", schemeUrl);
      Clipboard.setString(schemeUrl);
    } else {
      const result = `bundleName:${bundleName} moduleName:${moduleName}`;
      Clipboard.setString(result);
    }
    nativeToast("复制成功");
  };

  const getCurrentRoute = useCallback(() => {
    const navigationStacks = Navigation?.navigationContainerRefStack?.all?.();
    if (navigationStacks) {
      const lastStackIndex = navigationStacks.length - 1;
      const currentStack = navigationStacks[lastStackIndex];
      const rootState = currentStack?.getRootState?.();
      const bizPageRouteIndex = rootState?.index - 2;
      const pageRoute = rootState?.routes[bizPageRouteIndex];
      return pageRoute || {};
    } else {
      return {};
    }
  }, []);

  const getPageName = useCallback(() => {
    const currentRoute = getCurrentRoute();
    const pageName = currentRoute["name"] || "";
    if (pageName === 'Tabs') {
      const state = currentRoute['state'];
      const index = state['index'];
      const routes = state['routes'];
      const route = routes[index];
      const name = route['name'];
      console.log('pageName', name);
      return name;
    } else {
      console.log('pageName', pageName);
      return pageName;
    }
  }, []);

  const getPageParams = useCallback(() => {
    const currentRoute = getCurrentRoute();
    const pageName = currentRoute["name"] || {};
    if (pageName === 'Tabs') {
      const state = currentRoute['state'];
      const index = state['index'];
      const routes = state['routes'];
      const route = routes[index];
      const params = route['params'];
      console.log('params', params);
      return params;
    } else {
      const params = currentRoute['params'];
      console.log('params', params);
      return params;
    }
  }, []);

  const getSchemeUrl = useCallback((bundleName, moduleName) => {
    const pageName = getPageName() || "";
    const params = getPageParams() || {};
    const queryString = new URLSearchParams(
      params as Record<string, string>,
    ).toString();
    let schemeUrl = `xrn://xrn/v1/${bundleName}/${moduleName}/${pageName}`;
    if (queryString) {
      schemeUrl = `xrn://xrn/v1/${bundleName}/${moduleName}/${pageName}?${queryString}`;
    }
    return schemeUrl;
  }, []);

  const _listHeader = () => {
    return (
      <View style={styles.headerStyle}>
        <Text style={styles.headerText}>路由栈列表</Text>
        <Text style={styles.subTitle}>(红点表示当前页面路由信息，点击可复制)</Text>
      </View>
    );
  };

  const _renderItem = ({ item, index }: { item: RouteItem; index: number }) => {
    return (
      <TouchableOpacity
        onPress={() => _copyRouteInfo(index, item?.bundleName, item?.moduleName)}
      >
        <View style={styles.itemContainer}>
          <View style={styles.itemBox}>
            <View style={styles.bundleBox}>
              <Text style={styles.bundleKey}>bundleName:   </Text>
              <Text style={styles.bundleVal}>{item?.bundleName}</Text>
            </View>
            <View style={styles.moduleBox}>
              <Text style={styles.moduleKey}>moduleName:  </Text>
              <Text style={styles.moduleVal}>{item?.moduleName}</Text>
            </View>
            {
              (index === 0) ? 
              <View style={styles.pageBox}>
                <Text style={styles.pageKey}>pageName:  </Text>
                <Text style={styles.pageVal}>{getPageName()}</Text>
              </View> : null
            }
            {
              (index === 0) ? 
              <View style={styles.schemeBox}>
                <Text style={styles.schemeKey}>落地页Url:</Text>
                <Text style={styles.schemeVal}>{getSchemeUrl(item?.bundleName, item?.moduleName)}</Text>
              </View> : null
            }
          </View>
          {index === 0 ? <View style={styles.redDot} /> : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Page title="路由信息" hideHeader>
      <View style={styles.container}>
        <FlatList
          data={data}
          renderItem={_renderItem}
          // keyExtractor={(item) => item.title}
          ListHeaderComponent={_listHeader}
        />
      </View>
    </Page>
  );
};

export default RouteInfo;
