import React, { useEffect, useMemo, useRef } from "react";
import {
  DeviceEventEmitter,
  EmitterSubscription,
  View,
  NativeModules,
  NativeEventEmitter,
} from "react-native";
import {
  NavigationContainerWrapperProps as NavigationContainerWrapperPropsInternal,
  NavigationContainerWrapper as NavigationContainerWrapperInternal,
  InitialState,
  StackRouteConfig,
  NavigationContainerRef,
} from "@xrnjs/navigation";
import { Platform } from "@xrnjs/modules-core";

import { RedirectPage } from "../components/RedirectPage";

export type NavigationContainerProps = Omit<
  NavigationContainerWrapperPropsInternal,
  "routes"
> & {
  routes: StackRouteConfig | StackRouteConfig[];
  initialParams: string | object | null;
};

export interface NavigationContainerParams {
  initialState?: InitialState;
  initialRouteName?: string;
  initialRouteParams?: Record<string, any>;
}

const PageNotFound: StackRouteConfig = {
  path: "NotFound",
  component: RedirectPage,
};

const resolveInitialState = ({
  routes,
  initialParams,
}: {
  routes: StackRouteConfig[];
  initialParams: string | object | null;
}): InitialState | undefined => {
  const { initialState, initialRouteName, initialRouteParams } = (JSON.parse(
    initialParams as string
  ) || {}) as NavigationContainerParams;

  if (initialState) return initialState;

  if (initialRouteName) {
    const isRouteNameExist = routes.some(
      (item) => item.path === initialRouteName
    );

    const realInitialRouteName = isRouteNameExist
      ? initialRouteName
      : PageNotFound.path;

    const realInitialRouteParams = isRouteNameExist
      ? initialRouteParams
      : undefined;

    return {
      index: 0,
      routes: [
        {
          name: realInitialRouteName,
          params: realInitialRouteParams,
        },
      ],
    };
  }

  return undefined;
};

// declare const __PROD__: boolean

export const NavigationContainer: React.FC<NavigationContainerProps> = (
  props
) => {
  const { routes, initialParams, ...resetProps } = props;
  const navigationRef = useRef<NavigationContainerRef<any> | null>(null);

  // 在非prod的环境，监听native发送的悬浮球点击事件，prod环境代码移除
  useEffect(() => {
    let subscription: EmitterSubscription;
    // if (!__PROD__) {
    //   console.log('NATIVE_FLOAT_BAR_CLICK')
    if (Platform.OS === "ios") {
      const iosEventEmitter = new NativeEventEmitter(
        NativeModules?.BundleNavigation
      );
      subscription = iosEventEmitter?.addListener(
        "NATIVE_FLOAT_BAR_CLICK",
        (_res: any) => {
          if (navigationRef.current && navigationRef.current?.isReady()) {
            navigationRef.current?.navigate("DebugCenter");
          }
        }
      );
    } else {
      subscription = DeviceEventEmitter.addListener(
        "NATIVE_FLOAT_BAR_CLICK",
        (_res: any) => {
          if (navigationRef.current && navigationRef.current?.isReady()) {
            navigationRef.current?.navigate("DebugCenter");
          }
        }
      );
    }
    // }

    return () => {
      // if (!__PROD__) {
      subscription?.remove?.();
      // }
    };
  }, [props, resetProps, routes]);

  return useMemo(() => {
    const inputRoutes = Array.isArray(routes) ? routes : [routes];

    const mergedRoutes = [...inputRoutes, PageNotFound];

    // 在非prod的环境，注册devtools的routes，用来处理 Debug 面板相关能力，prod环境下移除此代码
    // if (!__PROD__) {
    const { DebugPanelRouters } = require("@xrnjs/devtools");
    // 追加 DebugPanelRouters 的路由
    mergedRoutes.push(...DebugPanelRouters);
    // }

    const resolvedInitialState = resolveInitialState({
      routes: mergedRoutes,
      initialParams,
    });

    return (
      <View style={{ flex: 1 }}>
        <NavigationContainerWrapperInternal
          ref={(appContainer) => {
            if (appContainer) {
              navigationRef.current = appContainer;
            }
            // appContainer &&
            //   routingInstrumentation.registerNavigationContainer(appContainer);
          }}
          {...resetProps}
          routes={mergedRoutes}
          initialState={resolvedInitialState}
        />
      </View>
    );
  }, [resetProps, routes, initialParams]);
};
