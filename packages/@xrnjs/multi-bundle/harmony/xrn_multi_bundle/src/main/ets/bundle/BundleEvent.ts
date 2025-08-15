/**
 * Event communication within a bundle.
 */
export type BundleEventArgsByEventName = {
  XT_BUNDLE_RELOAD: [{ reason: string | undefined }];
}