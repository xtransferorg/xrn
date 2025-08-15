import { useDeepCompareEffect } from "ahooks";
import React, { ReactElement, ReactNode, useCallback, useEffect } from "react";
import {
  BackHandler,
  Platform,
  StatusBar,
  StyleProp,
  View,
  ViewStyle,
  NativeModules,
  StyleSheet,
  Text
} from "react-native";

import {
  StackNavigationProp,
  useFocusEffect,
  useNavigation,
  goBack,
  Navigation,
} from "@xrnjs/navigation";
import { getStatusBarHeight } from "../utils/StatusBarUtils";

export type StatusBarType = "dark-content" | "light-content";

export interface PageProps {
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
  /** 页面标题  */
  title?: string;
  /** 是否隐藏header */
  hideHeader?: boolean;
  /** 是否隐藏左侧区域 */
  hideLeft?: boolean;
  /** 右上角 button */
  rightButton?: ReactElement;
  /** 状态栏的颜色，dark-content或者 light-content */
  statusBarStyle?: StatusBarType;
  /** 自定义 title 容器样式, 默认占满, 左右 margin 64 */
  titleContainerStyle?: StyleProp<ViewStyle>;
  onBack?: (navigation: StackNavigationProp) => boolean;
  /** 是否需要沉浸式导航栏，true：表示Page内的视图会顶到屏幕最顶端，paddingTop的值会被置为0 */
  translucent?: boolean;
  /** Page页面是否支持侧滑返回，默认值为true */
  gestureEnabled?: boolean;
}

const Page: React.FC<PageProps> = (props) => {
  const {
    title,
    style,
    onBack,
    hideLeft,
    children,
    hideHeader,
    rightButton,
    statusBarStyle = "dark-content",
    titleContainerStyle,
    translucent = true,
    gestureEnabled = true,
  } = props;

  const navigation = useNavigation();

  useEffect(() => {
    Platform.select({
      android: {
        setStatusBar: () => {
          StatusBar.setBackgroundColor("transparent");
          StatusBar.setTranslucent(true);
          StatusBar.setBarStyle(statusBarStyle);
        },
      },
      ios: {
        setStatusBar: () => {
          StatusBar.setBarStyle(statusBarStyle);
        },
      },
    })?.setStatusBar();
  }, []);

  useDeepCompareEffect(() => {
    const options = Navigation.navigationOptions.resolveDynamicScreenOptions(
      navigation,
      {
        pageTitle: title || "",
        gestureEnabled,
        hideHeader,
        hideLeft,
        headerRight: rightButton,
        onBack,
      }
    );

    navigation.setOptions({
      ...options,
      headerTitleContainerStyle: titleContainerStyle,
    });
  }, [
    navigation,
    title,
    gestureEnabled,
    hideHeader,
    hideLeft,
    rightButton,
    titleContainerStyle,
    onBack,
  ]);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === "ios" && !gestureEnabled) {
        NativeModules?.BundleNavigation?.gestureEnabled?.(false);
      }
      return () => {
        if (Platform.OS === "ios" && !gestureEnabled) {
          NativeModules?.BundleNavigation?.gestureEnabled?.(true);
        }
      };
    }, [gestureEnabled, navigation]),
  );

  useEffect(() => {
    const handleBackEvent = () => {
      if (onBack?.(navigation) || gestureEnabled === false) {
        return true;
      }
      goBack(navigation);
      return true;
    };
    BackHandler.addEventListener("hardwareBackPress", handleBackEvent);
    return () =>
      BackHandler.removeEventListener("hardwareBackPress", handleBackEvent);
  }, []);

  const handleBackPress = () => {
    goBack(navigation);
  };

  const hideHeaderStyle = hideHeader
    ? { paddingTop: translucent ? 0 : getStatusBarHeight(true) }
    : {};
  return (
    <View
      style={Object.assign(
        { display: "flex", flexDirection: "column", flex: 1 },
        hideHeaderStyle,
        style
      )}
    >
      <View style={styles.customHeader}>
        <Text style={styles.cusHeaderTitle}>{title}</Text>
        <View style={styles.rightButtonBox}>
          {
            rightButton
          }
        </View>
      </View>
      {children}
    </View>
  );
};

export { Page };

const styles = StyleSheet.create({
  customHeader: {
    width: '100%', 
    height: 88, 
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center'
  },
  cusHeaderTitle: { 
    marginTop: 50,
    fontSize: 16,
    fontWeight: 'bold'
  },
  rightButtonBox: { 
    position: 'absolute',
    right: 0,
    top: 50,
  },
});
