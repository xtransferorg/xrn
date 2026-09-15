import { useDeepCompareEffect } from "ahooks";
import React, { ReactElement, ReactNode, useEffect } from "react";
import {
  BackHandler,
  Platform,
  StatusBar,
  StyleProp,
  View,
  ViewStyle,
  NativeModules,
  NativeEventEmitter,
  NativeModule,
} from "react-native";
import { useSafeAreaFrame, useSafeAreaInsets } from "react-native-safe-area-context";

import {
  StackNavigationProp,
  useNavigation,
  goBack,
  Navigation,
  useRoute,
  setShouldInterceptSideSwipe,
  confirmShouldSideSwipePop,
  XRNBundleNavigation,
  XRNNavigation,
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
  translucent?: boolean,
  /** @deprecated 之后不再需要设置此属性，统一使用onBack来处理返回拦截逻辑
   * https://alidocs.dingtalk.com/i/nodes/G1DKw2zgV2R0OlqmcRK99o1RVB5r9YAn
   * Page页面是否支持侧滑返回，默认值为true 
   */
  gestureEnabled?: boolean,
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
    gestureEnabled = (Platform.OS === 'ios' && onBack) ? false : true
  } = props;

  const navigation = useNavigation()
  const { key } = useRoute()
  const isRemovingRef = React.useRef(false);

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

  const insets = useSafeAreaInsets()
  const frame = useSafeAreaFrame()

  useDeepCompareEffect(() => {
    const options = Navigation.navigationOptions.resolveDynamicScreenOptions(
      navigation,
      {
        pageTitle: title || '',
        gestureEnabled,
        hideHeader,
        hideLeft,
        headerRight: rightButton,
        onBack,
      }
    );

    const maxWidth =
      frame.width -
      ((!hideLeft || rightButton ? 48 : 16) +
        Math.max(insets.left, insets.right)) *
      2;

    const mergedTitleContainerStyle = Object.assign({}, { maxWidth }, titleContainerStyle)

    navigation.setOptions({
      ...options,
      headerTitleContainerStyle: mergedTitleContainerStyle,
    });
  }, [
    navigation,
    insets,
    frame,
    title,
    gestureEnabled,
    hideHeader,
    hideLeft,
    rightButton,
    titleContainerStyle,
    onBack,
  ]);

  useEffect(() => {
    const handleBackEvent = () => {
      // 处理Android Page页面禁止侧滑返回时，禁止执行goBack
      if (onBack?.(navigation) || gestureEnabled === false) {
        // 返回true，表示业务已处理返回事件，不需要系统介入
        return true;
      }
      goBack(navigation);
      return true;
    };
    const unsubscribe = BackHandler.addEventListener(
      'hardwareBackPress',
      handleBackEvent
    );
    return () => {
      unsubscribe.remove();
    };
  }, [gestureEnabled, navigation, onBack]);


  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    if (isRemovingRef.current) return;

    // 处理iOS的手势侧滑返回，如果Page页面的`onBack`函数有值且pageName有设置，代表此Page需要返回拦截
    if (onBack && gestureEnabled === false) {
      console.log('setShouldInterceptSideSwipe ✅', gestureEnabled, onBack, key)
      setShouldInterceptSideSwipe(true, key);
    } else {
      console.log('setShouldInterceptSideSwipe ❌', gestureEnabled, onBack, key)
      setShouldInterceptSideSwipe(false, key);
    }
  }, [onBack, gestureEnabled, key]);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;

    if (!gestureEnabled && !onBack) {
      // 只设置gestureEnabled=false，不设置onBack。
      XRNBundleNavigation?.gestureEnabled?.(false);
    }

    const handleIOSBackEvent = async (e: {
      routeKey: string; preventDefault: () => void; data: { action: any }
    }) => {
      if (e?.routeKey !== key) {
        // 如果不是当前页面的返回事件，直接返回
        return;
      }
      // 根据onBack返回值，决定是业务处理返回还是Page处理返回，true表示业务自己处理返回
      const result = onBack?.(navigation);
      console.log('handleIOSBackEvent Onback 🔥', result);
      if (result === false) {
        goBack(navigation);
      }
    }
    const iosEventEmitter = new NativeEventEmitter(XRNNavigation as unknown as NativeModule)
    const swipebackUnsubscribe = iosEventEmitter?.addListener('XT_IOS_PAGESIDESWIPEBACK', handleIOSBackEvent);

    const beforeRemoveUnsubscribe = navigation.addListener('beforeRemove', () => {
      confirmShouldSideSwipePop();
      isRemovingRef.current = true;
    });


    return () => {
      if (Platform.OS !== 'ios') return;

      if (!gestureEnabled && !onBack) {
        XRNBundleNavigation?.gestureEnabled?.(true);
      }
      beforeRemoveUnsubscribe();
      swipebackUnsubscribe?.remove?.();
    }
  }, [gestureEnabled, navigation, onBack, key]);

  const handleBackPress = () => {
    goBack(navigation);
  };

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
