import * as Sentry from "@sentry/react-native";
import React, { Suspense, useEffect, useMemo } from "react";
import { finishBundle, Navigation, } from "@xrnjs/navigation";
import { checkRNUpdate } from "../utils/codePushUtils";
import {
  NavigateBundleProps,
  NavigateBundleProvider,
} from "./NavigateParamsContext";
import { BundleConfig, bundleConfig } from "../bundle";
import {
  NavigationContainer,
  NavigationContainerProps,
} from "./NavigationContainer";

export type WrapperComponent = React.ComponentType<{
  children?: React.ReactNode;
}>;

export type InitModuleProps = {
  routers: NavigationContainerProps["routes"];

  autoCheckUpdate?: boolean;

  navigationContainerProps?: Pick<
    NavigationContainerProps,
    "onStateChange" | "linking"
  > & {
    getWrapperComponent?: (
      bundleConfig: BundleConfig,
      moduleConfig: { moduleName: string }
    ) => WrapperComponent;
  };
};

export function initModule({
  routers,
  autoCheckUpdate = true,
  navigationContainerProps = {},
}: InitModuleProps) {
  // console.log("bundleConfig", bundleConfig);

  if (!bundleConfig)
    console.warn(
      "***************** bundleConfig is not defined，⚠️⚠️⚠️必须先调用initBundle初始化 *****************"
    );

  const { appName, mainBundle = false } = bundleConfig || {};

  // 页面初始化
  const PageProvider: React.FC<NavigateBundleProps> = (
    props: NavigateBundleProps
  ) => {
    const { rootTag, params = null, moduleName } = props;

    const { getWrapperComponent, ...resetNavigationContainerProps } =
      navigationContainerProps;

    const NavigationContainerWrapperCom = useMemo(() => {
      return (
        getWrapperComponent?.(bundleConfig, { moduleName }) || React.Fragment
      );
    }, [getWrapperComponent, moduleName]);


    useEffect(() => {

      if (autoCheckUpdate) {
        checkRNUpdate({ isMain: mainBundle, timeout: 2 * 1000 });
      }
    }, []);

    const handleBackPress = () => {
      finishBundle();
    };

    return (
      <Suspense>
        <NavigationContainerWrapperCom>
          <NavigateBundleProvider
            rootTag={rootTag}
            params={params}
            moduleName={moduleName}
          >
            <NavigationContainer
              routes={routers}
              initialParams={params}
              interceptExtraData={{
                bundleName: appName,
                moduleName,
              }}
              // @ts-ignore
              onReady={(ref, key) => {
                Navigation.navigationContainerRefStack.push(key, ref);
              }}
              {...resetNavigationContainerProps}
            />
          </NavigateBundleProvider>
        </NavigationContainerWrapperCom>
      </Suspense>
    );
  };

  return Sentry.wrap(PageProvider as unknown as React.ComponentType<any>);
}
