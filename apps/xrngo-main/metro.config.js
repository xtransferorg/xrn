const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const {
  createHarmonyMetroConfig,
} = require('@react-native-oh/react-native-harmony/metro.config');

const config = {
  transformer: {
    // @xrnjs/cli currently invokes Metro 0.72, which requires this transformer
    // hook even when the React Native 0.77 default config is in use.
    unstable_collectDependenciesPath: require.resolve(
      'metro/src/ModuleGraph/worker/collectDependencies',
    ),
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
};

module.exports = mergeConfig(
  getDefaultConfig(__dirname),
  createHarmonyMetroConfig({
    reactNativeHarmonyPackageName: '@react-native-oh/react-native-harmony',
  }),
  config,
);
