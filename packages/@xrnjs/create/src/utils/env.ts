import { boolish } from 'getenv';

class Env {
  /** Enable debug logging */
  get XRN_DEBUG() {
    return boolish('XRN_DEBUG', false);
  }
  /** Enable the beta version of Expo (TODO: Should this just be in the beta version of expo releases?) */
  get XRN_BETA() {
    return boolish('XRN_BETA', false);
  }
  /** Is running in non-interactive CI mode */
  get CI() {
    return boolish('CI', false);
  }
  /** Disable all API caches. Does not disable bundler caches. */
  get EXPO_NO_CACHE() {
    return boolish('EXPO_NO_CACHE', false);
  }
  /** Disable telemetry (analytics) */
  get EXPO_NO_TELEMETRY() {
    return boolish('EXPO_NO_TELEMETRY', false);
  }
}

export const env = new Env();
