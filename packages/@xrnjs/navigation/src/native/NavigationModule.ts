import { safeStringifyNavigationParams } from "../utils";
import { XRNBundleNavigation } from "./XRNBundleNavigation";
import { XRNNavigation } from "./XRNNavigation";

type Params =
  | object
  | {
      initialRouteName?: string;
      initialRouteParams?: object;
    };

// TODO remove this
const routerWithTitle = (routerConfigs: Array<any>) => {
  return {};
};

const currentTime = () => new Date().getTime();

const completeParams = (params: Params = {}) => {
  const initialRouteParams = (params as any).initialRouteParams || {};
  return Object.assign({}, params, {
    initialRouteParams: Object.assign({}, initialRouteParams, {
      _startTime: currentTime(),
    }),
  });
};

const completeEventParams = (params?: Params) => {
  return JSON.stringify(params || {});
};

/**
 * 关闭当前 module。
 *
 * @returns {void}。
 */
function finishBundle(): void {
  XRNBundleNavigation.goBack();
}

/**
 * 导航到指定的 bundle，并可选指定 module 名称和启动参数。
 *
 * @param bundleName - bundle 名称。
 * @param moduleName - module 名称。
 * @param params - 启动参数。
 * @throws {Error} 如果未提供 bundleName。
 *
 * @deprecated 请使用 `navigation.navigate()`。
 */
function navigateBundle(
  bundleName: string,
  moduleName?: string,
  params?: Params
) {
  console.warn("navigateBundle 已废弃，请使用 navigation.navigate()");

  if (!bundleName) {
    throw Error("bundleName不能为空");
  }
  XRNBundleNavigation.navPushBundleProject(
    bundleName,
    moduleName,
    safeStringifyNavigationParams(
      bundleName,
      moduleName,
      completeParams(params)
    )
  );
}

/**
 * 替换指定的 bundle，并可选指定 module 名称和启动参数。
 *
 * @param bundleName - bundle 名称。
 * @param moduleName - module 名称。
 * @param params - 启动参数。
 * @throws {Error} 如果未提供 bundleName。
 *
 * @deprecated 请使用 `navigation.replace()`。
 */
function replaceBundle(
  bundleName: string,
  moduleName?: string,
  params?: Params
) {
  console.warn("replaceBundle 已废弃，请使用 navigation.replace()");

  if (!bundleName) {
    throw Error("bundleName不能为空");
  }
  XRNBundleNavigation.navReplaceBundleProject(
    bundleName,
    moduleName,
    safeStringifyNavigationParams(
      bundleName,
      moduleName,
      completeParams(params)
    )
  );
}

/**
 * 发送 bundle 内事件。
 *
 * @param eventName - 事件名称。
 * @param payload - 可选参数，事件携带的数据。
 * @throws {Error} 如果未提供 eventName
 */
function pushEvent(eventName: string, payload?: Params) {
  if (!eventName) {
    throw Error("eventName不能为空");
  }
  XRNBundleNavigation.publishSingleBundleEvent(
    eventName,
    completeEventParams(payload)
  );
}

/**
 * 发送 App 内事件。
 *
 * @param eventName - 事件名称。
 * @param payload - 可选参数，事件携带的数据。
 * @throws {Error} 如果未提供 eventName
 */
function pushAllEvent(eventName: string, payload?: Params) {
  if (!eventName) {
    throw Error("eventName不能为空");
  }
  XRNBundleNavigation.publishAllBundleEvent(
    eventName,
    completeEventParams(payload)
  );
}

/**
 * 获取当前 module 信息。
 *
 * @returns {Promise<any>} 返回一个包含当前模块信息的 Promise。
 */
const getCurrentModuleInfo = async () => {
  return await XRNNavigation.getCurrentModuleInfo();
};

const setShouldInterceptSideSwipe = (
  shouldIntercept: boolean,
  routeKey: string
) => {
  XRNNavigation.setShouldInterceptSideSwipe(shouldIntercept, routeKey);
};

const confirmShouldSideSwipePop = () => {
  XRNNavigation.confirmShouldSideSwipePop();
};

export {
  routerWithTitle,
  replaceBundle,
  navigateBundle,
  finishBundle,
  pushEvent,
  pushAllEvent,
  getCurrentModuleInfo,
  setShouldInterceptSideSwipe,
  confirmShouldSideSwipePop,
};
