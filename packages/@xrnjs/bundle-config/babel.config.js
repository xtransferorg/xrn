// xrn-business-config/babel.config.js
const plugins = [
  [
    "transform-define",
    {
      __PROD__: process.env.ENV_NAME === "prod",
    },
  ],
  "react-native-reanimated/plugin",
];

if (process.env.COVERAGE === "true") {
  plugins.unshift([
    "istanbul",
    {
      exclude: [
        "**/node_modules/**",
        "**/__tests__/**",
        "**/*.test.*",
        //排除 bundle 根目录下相关无需插桩文件
        "__coverage_startup__.js",
        "appInit.*",
        "component.config.*",
        "i18n-ast.config.*",
        "initRequest.*",
        "xrn.config.*",
        "i18n.*",
      ],
    },
  ]);
}

module.exports = {
  presets: ["module:@react-native/babel-preset", "const-enum"],
  plugins,
  env: {
    production: {
      plugins: ["transform-remove-console"],
    },
  },
};
