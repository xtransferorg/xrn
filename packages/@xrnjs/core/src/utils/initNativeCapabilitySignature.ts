export interface NativeCapabilitySignature {
  currentVersion?: string;
  latestVersion?: string;
  components: string[];
  modules: Record<string, string[]>;
}

export const initNativeCapabilitySignature = (
  latestSignature: NativeCapabilitySignature
) => {
  const latestNativeCapabilitySignatureKey =
    "__LATEST_NATIVE_CAPABILITY_SIGNATURE__";
  (globalThis as any)[latestNativeCapabilitySignatureKey] = latestSignature;
};
