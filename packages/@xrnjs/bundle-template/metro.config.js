const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config')
const { createHarmonyMetroConfig } = require('@react-native-oh/react-native-harmony/metro.config')
/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  serializer: {},
}

module.exports = mergeConfig(
  getDefaultConfig(__dirname),
  createHarmonyMetroConfig({
    reactNativeHarmonyPackageName: '@react-native-oh/react-native-harmony',
  }),
  config,
)
