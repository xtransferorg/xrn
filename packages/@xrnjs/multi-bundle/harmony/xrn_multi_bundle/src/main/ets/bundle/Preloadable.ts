import { JSBundleProvider } from "@rnoh/react-native-openharmony/src/main/ets/RNOH/JSBundleProvider";


export const TAG_PRELOAD = "[Preload]"

/**
 * 支持预加载的 JSBundleProvider 接口。
 * 实现后，@xrnjs/multi-bundle 会在加载 common bundle 的同时并发调用 sync()，
 * 让预加载（线上热更新 check/download、开发环境 Metro 连接等）与 common 加载并发推进。
 * sync() 失败时静默忽略，不影响后续 getBundle() 的正常加载流程。
 */
export interface Preloadable extends JSBundleProvider {
  preload(): Promise<void>;
}

export function isPreloadable(provider: JSBundleProvider): provider is Preloadable {
  return provider != null && typeof (provider as Preloadable).preload === 'function';
}
