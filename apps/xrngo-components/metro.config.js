const {mergeConfig, getDefaultConfig} = require('@react-native/metro-config');
const path = require('path');

/**
 * xrngo-components 是从 @xrnjs/ui 仓库 example 目录迁移出来的独立业务 bundle。
 * example 里通过 metro 的 extraNodeModules 把 `root` 别名指向
 * `@xrnjs/ui/src/components`（即组件库源码），从而解析
 * `root/Theme/constant`、`root/<Component>/__fixtures__/*` 等引用。
 * 迁移成独立 bundle 时这个别名丢失了，这里重新指回私域安装的
 * `@xrnjs/ui/src/components`（package.json 的 files 字段包含 src）。
 */
const uiPackagePath = require.resolve('@xrnjs/ui/package.json');
const uiComponentsPath = path.join(path.dirname(uiPackagePath), 'src', 'components');

const config = {
  resolver: {
    extraNodeModules: {
      // example 里 `root` 指向 @xrnjs/ui/src/components（组件源码 + fixtures + Theme）
      root: uiComponentsPath,
      // example 里 `_global` 指向 .dumi/global，不随包发布，这里在本地补一份
      _global: path.resolve(__dirname, 'src/_global'),
      // @xrnjs/ui 迁移前包名为 xtd-rn，定制版 react-native-permissions 等仍引用旧名
      'xtd-rn': path.dirname(uiPackagePath),
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
