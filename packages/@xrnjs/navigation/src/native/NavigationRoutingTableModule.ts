/* import { NativeModules } from "react-native";
import { RouteConfig } from "../types";
import { spliceModuleName } from "../utils";

const NavigationRoutingTableModule =
  NativeModules.XRNNavigationRoutingTableModule;

const get = (path: string): RouteConfig => {
  return NavigationRoutingTableModule.get(path);
};

const contains = (path: string): boolean => {
  return NavigationRoutingTableModule.contains(path);
};

const merge = (...args: Omit<RouteConfig, "bundleName" | "moduleName">[]) => {
  const routerConfigs: RouteConfig[] = args.map((item) => {
    return {
      ...item,
      bundleName: "xt-app-login",
      moduleName: spliceModuleName(item.path),
      screenName: item.path,
    };
  });

  NavigationRoutingTableModule.merge(JSON.stringify(routerConfigs));
};

export default {
  get,
  contains,
  merge,
};
 */
