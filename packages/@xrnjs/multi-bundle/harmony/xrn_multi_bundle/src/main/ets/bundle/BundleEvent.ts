/**
 * Bundle 内的事件通信
 */
export type BundleEventArgsByEventName = {
  XT_BUNDLE_RELOAD: [{ reason: string | undefined }];
}