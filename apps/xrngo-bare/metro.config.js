// const path = require('path');
// const monorepoRoot = path.join(__dirname, '../..');
// const blacklist = require('metro-config/src/defaults/exclusionList');

const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const {
  createHarmonyMetroConfig,
} = require('@react-native-oh/react-native-harmony/metro.config');

const config = {
  // watchFolders: [
  //   __dirname, // Allow Metro to resolve all files within this project
  //   // path.join(monorepoRoot, 'packages'), // Allow Metro to resolve all workspace files of the monorepo
  //   // path.join(monorepoRoot, 'node_modules'), // Allow Metro to resolve "shared" `node_modules` of the monorepo
  // ],
  // resolver: {
  //   unstable_enableSymlinks: true, // Turn on symlink support
  //   nodeModulesPaths: [path.resolve(__dirname, 'node_modules')],
  // },
  transformer: {
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
