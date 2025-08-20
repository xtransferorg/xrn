module.exports = {
  root: true,
  extends: ["universe/native"],
  overrides: [
    {
      files: ["**/__tests__/*"],
      env: { node: true },
      globals: { __DEV__: true },
    },
    {
      files: ["./*.config.js", "./.*rc.js"],
      extends: ["universe/node"],
    },
  ],
  rules: {
    "no-restricted-imports": [
      "warn",
      {
        // fbjs is a Facebook-internal package not intended to be a public API
        patterns: ["fbjs/*", "fbjs"],
      },
    ],
    // 如果需要覆盖 Prettier 默认规则：
    "prettier/prettier": [
      "warn",
      {
        trailingComma: "all",
      },
    ],
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": "off",
  },
};
