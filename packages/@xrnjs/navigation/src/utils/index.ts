import { Navigation, NavigationAction } from "../core";
import { getCurrentModuleInfo } from "../native/NavigationModule";

type PageInfo = {
  bundleName: string;
  moduleName?: string;
  pageName?: string;
};

const captureBundleNavigationException = async (
  targetPageInfo: PageInfo,
  params: string
) => {
  try {
    const sourceModuleInfo = (await getCurrentModuleInfo()) || {};
    const sourcePageName = Navigation.current()?.getCurrentRoute()?.name;

    const {
      ErrorLevel,
      monitor,
      StandardErrorCollection,
    } = require("xrn-monitor");

    monitor.captureException(
      new StandardErrorCollection.BizError(
        "跨 bundle 跳转异常",
        ErrorLevel.P3,
        "BundleNavigationError"
      ),
      {
        extra: {
          source: {
            ...sourceModuleInfo,
            pageName: sourcePageName,
          },
          target: {
            ...(targetPageInfo || {}),
          },
          params,
          paramsSize: `${((params.length * 2) / 1024).toFixed(2)} kb`,
        },
      }
    );
  } catch (e) {
    console.log("CaptureException Error: ", e);
  }
};

/**
 * 判断是否是大数据量的payload
 * @param payload
 * @param threshold 阈值：128kb
 * @returns {boolean}
 */
const isLargePayload = (payload: string, threshold: number = 256) => {
  if (typeof payload !== "string") {
    return false;
  }

  return (payload.length * 2) / 1024 >= threshold;
};

export const safeStringifyNavigationParams = (
  bundleName: string,
  moduleName?: string,
  params?: object
) => {
  let jsonParams = "";

  try {
    jsonParams = JSON.stringify(params || {});
  } catch (e) {
    jsonParams = "";
  }

  if (params && isLargePayload(jsonParams)) {
    captureBundleNavigationException(
      {
        bundleName,
        moduleName,
        pageName:
          "initialRouteName" in params
            ? (params["initialRouteName"] as string)
            : undefined,
      },
      jsonParams
    );
  }

  return jsonParams;
};

export const safeStringifyNavigationAction = (action: NavigationAction) => {
  let jsonAction = "";

  try {
    jsonAction = JSON.stringify(action);
  } catch (e) {
    jsonAction = "";
  }

  if (isLargePayload(jsonAction)) {
    // @ts-ignore
    const name = action.payload?.name;

    if (typeof name === "string") {
      // '/{bundleName}/{moduleName}/{pageName}'
      const [, bundleName, moduleName, pageName] = name.split("/");

      captureBundleNavigationException(
        {
          bundleName,
          moduleName,
          pageName,
        },
        jsonAction
      );
    }
  }

  return jsonAction;
};
