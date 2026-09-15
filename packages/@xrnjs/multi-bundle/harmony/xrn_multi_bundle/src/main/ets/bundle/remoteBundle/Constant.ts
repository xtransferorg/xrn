import { HttpTimeoutOption } from "./ts"

export const BUNDLE_404_SCENE = {
  SCENE_NAV_GET_BUNDLE_INFO_HTTP_ERROR: "nav_get_bundle_info_http_error",
  SCENE_NAV_GET_BUNDLE_INFO_INVALID_BUNDLE: "nav_get_bundle_info_invalid_bundle"
}


export const DEFAULT_HTTP_TIMEOUT: HttpTimeoutOption = {
  connectTimeoutMills: 10_000,
  readTimeoutMills: 10_000,
}