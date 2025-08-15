import React, { Suspense, useEffect } from "react";
import { checkRNUpdate } from "../utils/codePushUtils";
import {
  NavigateBundleProps,
  NavigateBundleProvider,
} from "./NavigateParamsContext";
import { bundleConfig } from "../bundle";
import {
  NavigationContainer,
  NavigationContainerProps,
} from "./NavigationContainer";

export type InitModuleProps = {
  routers: NavigationContainerProps["routes"];

  autoCheckUpdate?: boolean;

  navigationContainerProps?: Pick<
    NavigationContainerProps,
    "onStateChange" | "linking"
  > & {
    WrapperComponent?: React.ComponentType<{
      children?: React.ReactNode;
    }>;
  };
};

export function initModule({
  routers,
  autoCheckUpdate = true,
  navigationContainerProps = {} as any,
}: InitModuleProps) {
  console.log("bundleConfig", bundleConfig);

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

    const {
      WrapperComponent: NavigationContainerWrapperCom = React.Fragment,
      ...resetNavigationContainerProps
    } = navigationContainerProps;

    useEffect(() => {
      if (autoCheckUpdate) {
        checkRNUpdate({ isMain: mainBundle, timeout: 2 * 1000 });
      }
    }, []);

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
              {...resetNavigationContainerProps}
            />
          </NavigateBundleProvider>
        </NavigationContainerWrapperCom>
      </Suspense>
    );
  };
  return PageProvider;
}
