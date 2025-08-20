// Property key naming convention: scope_module_function_key
// scope values:
//   - app: global scope (entire process)
//   - local: local scope (page level)
//   - env: environment variable

// Built-in RNOH keys
export const APP_RNOH_RNOHCoreContext = "RNOHCoreContext"

// Global data keys
export const APP_BUNDLE_BUNDLE_INFO_MANAGER = "app_bundle_bundle_info_manager"
export const APP_BUNDLE_RN_INSTANCE_PREFIX = "app_xt_bundle_"
export const APP_RN_RNINSTANCE_MANAGER = "app_rn_rninstance_manager"
export const APP_RN_RNINSTANCE_MAP = "app_rn_rninstance_map"
export const APP_RN_BUNDLE_STATE_MAP = "app_rn_bundle_state_map"

// Event for restarting the current bundle
export const EVENT_BUNDLE_RELOAD = "XT_BUNDLE_RELOAD"