#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const { applyPatches } = require("./apply-patches");
const root = process.cwd();
const packageName = require("../package.json").name;
const packageRoot = path.join(root, "node_modules", packageName);

function removeMetroPackages() {
  const metroConfigPath = path.join(
    packageRoot,
    "node_modules",
    "@react-native",
    "metro-config",
    "node_modules"
  );

  // 删除 `@react-native/metro-config` 里的 `node_modules` 目录
  if (fs.existsSync(metroConfigPath)) {
    console.log(
      "Remove metro-config, metro-react-native-babel-transformer, metro-runtime from node_modules"
    );
    [
      "metro-config",
      "metro-react-native-babel-transformer",
      "metro-runtime",
    ].forEach((packageName) => {
      const packagePath = path.join(metroConfigPath, packageName);
      if (fs.existsSync(packagePath)) {
        fs.rmdirSync(packagePath, { recursive: true });
      }
    });
    console.log(
      "Remove metro-config, metro-react-native-babel-transformer, metro-runtime from node_modules - done"
    );
  }
}

function postInstall() {
  removeMetroPackages();
  applyPatches();
}

module.exports = {
  postInstall,
};
