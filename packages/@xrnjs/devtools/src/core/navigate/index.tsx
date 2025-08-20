import { navigateBundle as navigationBundleV1, finishBundle as finishBundleV1 } from "@xrnjs/navigation"

type Params =
  | object
  | {
      initialRouteName?: string;
      initialRouteParams?: object;
    };

/**
 * 关闭当前module
 */
function finishBundle(): void {
  finishBundleV1();
}

/*
原生导航栈顶Push Bundle
*/
function navigateBundle(
  bundleName: string,
  moduleName?: string,
  params?: Params,
) {
  navigationBundleV1(bundleName, moduleName, params);
}

export {
  finishBundle,
  navigateBundle,
};
