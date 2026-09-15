import { ToastUtil } from "@pura/harmony-utils";
import { BundleInfoManager, isBundleRegistered, REMOTE_BUNDLE_MANAGER, RemoteBundleInfo,
  BundleInfo,
  convertRemoteBundle2BundleInfo,
  RN_INSTANCE_MANAGER} from "@xrnjs/multi-bundle";
import { emitter } from "@kit.BasicServicesKit";

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
  initialRouteParams?: Record<string, number | string | boolean> | null
  initialState?: string | null
}

export function isTargetExist(
  bundleName: string | null | undefined,
  showToastWhenError: boolean = true
): boolean {
  const registered = typeof bundleName === "string" && isBundleRegistered(bundleName)

  if (showToastWhenError && !registered) {
    ToastUtil.showShort(`跳转失败，${bundleName}未注册`)
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

function checkBiz(params: ModuleRouteParams, action: () => void): void {
  if (!isTargetExist(params.bundleName, false)) {
    REMOTE_BUNDLE_MANAGER.getBundleInfo(params.bundleName, (bundleInfo: RemoteBundleInfo) => {
      if (bundleInfo && bundleInfo.bundleName) {
        const localBundleInfo = convertRemoteBundle2BundleInfo(bundleInfo)
        BundleInfoManager.INSTANCE.registerBundleInfo(localBundleInfo)
        RN_INSTANCE_MANAGER.registerBundleInfo(localBundleInfo)
        action()
      } else {
        toBundle404("nav_get_bundle_info_invalid_bundle", undefined, params)
      }
    }, (err: object) => {
      toBundle404("nav_get_bundle_info_http_error", err, params)
    })
  }
  action()
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
  checkBiz(params, () => {
    GlobalNavPathStack.replacePath({
      name: NavPath.Biz,
      param: params
    })
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
  checkBiz(params, () => {
    GlobalNavPathStack.pushPathByName(NavPath.Biz, params)
  })
  return true
}

export function toBundle404(scene: string, err?: object, params?: ModuleRouteParams): boolean {
  emitter.emit("XT_BUNDLE_ERROR_SHOW", {data:{"scene": scene, error: err, "navData": JSON.stringify(params)}})
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
