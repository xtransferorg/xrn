import { RNInstance } from "@rnoh/react-native-openharmony";
import { getRNInstance } from "@xrnjs/multi-bundle";
import { getNavTopParam, ModuleRouteParams } from "../native/NavHelper";

export function getNativeTopReactInstance(): RNInstance | undefined {
  const param = getNavTopParam<ModuleRouteParams>()

  const bundleName = param?.bundleName
  const moduleName = param?.moduleName

  if (!bundleName || !moduleName) {
    return undefined
  }

  return getRNInstance(bundleName)
}
