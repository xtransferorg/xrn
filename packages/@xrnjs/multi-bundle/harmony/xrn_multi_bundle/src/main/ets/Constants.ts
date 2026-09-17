//属性key命名规则 scope_module_function_key
//scope 目前有 app: 全局（整个进程）; local: 局部（页面级别）; env: 环境变量；

//RNOH 内置的key
export const APP_RNOH_RNOHCoreContext = "RNOHCoreContext"

//全局数据对应的 Key
export const APP_BUNDLE_BUNDLE_INFO_MANAGER = "app_bundle_bundle_info_manager"
export const APP_BUNDLE_RN_INSTANCE_PREFIX = "app_xt_bundle_"
export const APP_RN_RNINSTANCE_MANAGER = "app_rn_rninstance_manager"
export const APP_RN_RNINSTANCE_MAP = "app_rn_rninstance_map"
export const APP_RN_BUNDLE_STATE_MAP = "app_rn_bundle_state_map"

//重启当前 bundle
export const EVENT_BUNDLE_RELOAD = "XT_BUNDLE_RELOAD"