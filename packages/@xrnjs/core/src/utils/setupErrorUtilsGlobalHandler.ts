import { getCurrentModuleInfo, Navigation } from '@xrnjs/navigation';
import * as Sentry from '@sentry/react-native';

export function setupUnsupportedNativeCapabilityHandler() {
  (globalThis as any).unsupportedNativeCapabilityHandler = async (message?: string) => {
    try {
      const moduleInfo = (await getCurrentModuleInfo()) || {};
      const unsupportedNativeCapabilityError = new Error(message);
      unsupportedNativeCapabilityError.name = 'UNSUPPORTED_NATIVE_CAPABILITY';
      Sentry.captureException(unsupportedNativeCapabilityError, {
        level: 'info',
        fingerprint: ['unsupported-native-capability'],
        tags: {
          alert_type: 'unsupported_native_capability',
          ...moduleInfo,
        },
      });
    } catch (error) {
      Sentry.captureException(error);
    } finally {
      Navigation.current()?.navigate('UpgradePage' as never);
    }
  };

}

export function setupUnknownNativeCapabilityHandler() {
  (globalThis as any).unknownNativeCapabilityHandler = async (message?: string) => {
    const moduleInfo = (await getCurrentModuleInfo()) || {};
    Sentry.captureException(new Error(message || 'Unknown Native Capability'), {
      tags: {
        ...moduleInfo,
      },
    });
  };
}
