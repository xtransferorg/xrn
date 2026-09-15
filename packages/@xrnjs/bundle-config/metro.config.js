const { mergeConfig } = require("@react-native/metro-config");
const {
  createHarmonyMetroConfig,
} = require("@react-native-oh/react-native-harmony/metro.config");
const path = require("path");

/**
 * @returns {import("metro-config").InputConfigT}
 */
function createXRNMetroConfig() {
  return mergeConfig(
    {
      serializer: {
        polyfillModuleNames: [
          path.resolve(
            __dirname,
            "node_modules/metro-runtime/src/polyfills/require.js",
          ),
        ],
      },
    },
    createHarmonyMetroConfig({
      reactNativeHarmonyPackageName: "@react-native-oh/react-native-harmony",
    }),
  );
}

module.exports = {
  createXRNMetroConfig,
};
