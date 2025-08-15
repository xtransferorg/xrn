// import { ToastUtil } from "@pura/harmony-utils";
import { BundleInfoManager, isBundleRegistered } from "xrn-multi-bundle/ts";

export const GlobalNavPathStack = new NavPathStack()

export function getNavTopParam<T>(): T | null {
  const size = GlobalNavPathStack.size()
  return GlobalNavPathStack.getParamByIndex(size - 1) as T | null
}

export enum NavPath {
  Splash = 'Splash',
  Main = 'Main',
  Biz = 'Biz',
}

let _defaultMainModuleInfo: BasicModuleInfo = {
  bundleName: "",
  moduleName: ""
}

export function getDefaultMainModuleInfo(): BasicModuleInfo {
  if (!_defaultMainModuleInfo.bundleName) {
    const defaultBundleInfo = BundleInfoManager.INSTANCE.getMainBundleInfo()
    const defaultBundleName = defaultBundleInfo?.bundleName || ''
    const defaultModuleName = defaultBundleInfo?.defaultModuleName || defaultBundleName
    _defaultMainModuleInfo = {
      bundleName: defaultBundleName,
      moduleName: defaultModuleName
    }
  }

  return _defaultMainModuleInfo
}

export function isMainBundle(bundleName: string): boolean {
  return bundleName === getDefaultMainModuleInfo().bundleName
}

export interface BasicModuleInfo {
  bundleName: string
  moduleName: string
}

export interface ModuleRouteParams extends BasicModuleInfo {
  initialProps?: RNAppInitialProps
}

export interface RNAppInitialProps {
  initialRouteName?: string | null
  initialRouteParams?: Record<string, object> | null
  initialState?: string | null
}

export function isTargetExist(
  bundleName: string | null | undefined,
  showToastWhenError: boolean = true
): boolean {
  const registered = typeof bundleName === "string" && isBundleRegistered(bundleName)

  if (showToastWhenError && !registered) {
    // ToastUtil.showShort(`跳转失败，${bundleName}未注册`)
  }

  return registered
}

export function buildModuleParams(
  bundleName: string,
  moduleName?: string,
  initialProps?: RNAppInitialProps
): ModuleRouteParams {
  return {
    bundleName,
    moduleName: moduleName ? moduleName : bundleName,
    initialProps
  }
}

export function buildMainModuleParams(initialProps?: RNAppInitialProps): ModuleRouteParams {
  const moduleInfo = getDefaultMainModuleInfo()

  return buildModuleParams(moduleInfo.bundleName, moduleInfo.moduleName, initialProps)
}

export function getModuleRouteParams(): ModuleRouteParams | null {
  return getNavTopParam<ModuleRouteParams>()
}

export function replaceToMain(initialProps?: RNAppInitialProps): boolean {
  const index = GlobalNavPathStack.getIndexByName(NavPath.Main)
  // Main 是否存在
  if (index.length > 0) {
    GlobalNavPathStack.popToIndex(index[0])
    return true
  }

  GlobalNavPathStack.replacePath({
    name: NavPath.Main,
    param: buildMainModuleParams(initialProps)
  })

  return true
}

export function replaceToBiz(params: ModuleRouteParams) {
  if (!isTargetExist(params.bundleName)) {
    return false
  }

  GlobalNavPathStack.replacePath({
    name: NavPath.Biz,
    param: params
  })

  return true
}

export function toMain(initialProps?: RNAppInitialProps): boolean {
  GlobalNavPathStack.pushPath(
    {
      name: NavPath.Main,
      param: buildMainModuleParams(initialProps)
    },
    {
      launchMode: LaunchMode.POP_TO_SINGLETON
    }
  )

  return true
}

export function toBiz(params: ModuleRouteParams): boolean {
  if (!isTargetExist(params.bundleName)) {
    return false
  }

  GlobalNavPathStack.pushPathByName(NavPath.Biz, params)

  return true
}

export function startModuleContainer(
  bundleName: string,
  moduleName?: string,
  initialProps?: RNAppInitialProps
): boolean {
  if (isMainBundle(bundleName)) {
    return toMain(initialProps)
  } else {
    return toBiz(buildModuleParams(bundleName, moduleName, initialProps))
  }
}

export function replaceModuleContainer(
  bundleName: string,
  moduleName?: string,
  initialProps?: RNAppInitialProps
): boolean {
  if (isMainBundle(bundleName)) {
    return replaceToMain(initialProps)
  } else {
    return replaceToBiz(buildModuleParams(bundleName, moduleName, initialProps))
  }
}
