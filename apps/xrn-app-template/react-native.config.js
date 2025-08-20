const { dependencies } = require("@xrnjs/core/package.json");

const coreDeps = Object.keys(dependencies).reduce((acc, key) => {
  if (!key.includes("@react-native-oh-tpl")) {
    acc[key] = {
      platforms: {},
    };
  }
  return acc;
}, {});


module.exports = {
  project: {
    ios: {},
    android: {}, // grouped into "project"
  },
  reactNativePath: './node_modules/react-native',
  dependencies: {
    ...coreDeps,
    '@xrnjs/react-native-code-push': {
      platforms: {
        // null means don't auto link
        android: null,
        ios: null,
      },
    },
    'react-native-fs': {
      platforms: {
        // android: null,
        ios: null,
      },
    },
    '@react-native-oh-tpl/react-native-get-random-values': {
      platforms: {
        android: null,
        ios: null,
      }
    },
    '@react-native-oh-tpl/react-native-orientation-locker': {
      platforms: {
        android: null,
        ios: null,
      }
    },
  },
}
