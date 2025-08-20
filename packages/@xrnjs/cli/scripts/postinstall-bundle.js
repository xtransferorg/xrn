#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const { postInstall } = require("./postinstall");

const root = process.cwd();

// 修改 react-native-permissions 的 types 字段
function patchTypesForReactNativePermissions() {
  const pkgPath = path.join(
    root,
    "node_modules",
    "react-native-permissions",
    "package.json"
  );
  const typesPath = path.join(
    root,
    "node_modules",
    "@react-native-oh-tpl",
    "react-native-permissions",
    "dist",
    "typescript",
    "index.d.ts"
  );

  if (fs.existsSync(pkgPath) && fs.existsSync(typesPath)) {
    try {
      const pkgContent = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
      pkgContent.types =
        "../@react-native-oh-tpl/react-native-permissions/dist/typescript/index.d.ts";
      fs.writeFileSync(pkgPath, JSON.stringify(pkgContent, null, 2));
      console.log(
        "✅ Patched react-native-permissions types field successfully."
      );
    } catch (err) {
      console.error(
        "❌ Failed to patch types in react-native-permissions:",
        err
      );
    }
  } else {
    console.log("⚠️ react-native-permissions package.json not found.");
  }
}

postInstall();
patchTypesForReactNativePermissions();
