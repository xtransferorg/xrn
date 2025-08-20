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
} from "react-native";
import {
  StackNavigationProp,
  useFocusEffect,
  useNavigation,
  goBack,
  Navigation,
} from "@xrnjs/navigation";
import { getStatusBarHeight } from "../../utils/StatusBarUtils";
import { ErrorBoundary } from "../ErrorBoundary";

// 导航栏上方状态栏样式
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
    translucent,
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      // 处理iOS Page页面禁止侧滑返回时逻辑
      if (Platform.OS === "ios" && !gestureEnabled) {
        NativeModules?.BundleNavigation?.gestureEnabled(false);
      }
      return () => {
        if (Platform.OS === "ios" && !gestureEnabled) {
          NativeModules?.BundleNavigation?.gestureEnabled(true);
        }
      };
    }, [gestureEnabled])
  );

  useEffect(() => {
    const handleBackEvent = () => {
      // 处理Android Page页面禁止侧滑返回时，禁止执行goBack
      if (onBack?.(navigation) || gestureEnabled === false) {
        return true;
      }
      goBack(navigation);
      return true;
    };
    BackHandler.addEventListener("hardwareBackPress", handleBackEvent);
    return () =>
      BackHandler.removeEventListener("hardwareBackPress", handleBackEvent);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // 处理hideHeader后状态栏白色bug，如果需要自定义paddingTop值，在业务侧Page组件style中重写paddingTop，backgroundColor同理
  const hideHeaderStyle = hideHeader
    ? { paddingTop: translucent ? 0 : getStatusBarHeight(true) }
    : {};
  return (
    <ErrorBoundary>
      <View
        style={Object.assign(
          { display: "flex", flexDirection: "column", flex: 1 },
          hideHeaderStyle,
          style
        )}
      >
        {children}
      </View>
    </ErrorBoundary>
  );
};

export { Page };
