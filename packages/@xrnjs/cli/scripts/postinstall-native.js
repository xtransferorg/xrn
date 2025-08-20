#!/usr/bin/env node
const fs = require("fs");

const { postInstall } = require("./postinstall");

const root = process.cwd();

function writeBundleConfig() {
  const xrnConfigPath = `${root}/xrn.config.json`;
  const xrnConfig = require(xrnConfigPath);
  const androidConfigPath = `${root}/android/app/src/main/res/raw/bundle_config.json`;
  const harmonyConfigPath = `${root}/harmony/entry/src/main/resources/rawfile/bundle_config.json5`;

  const updatedBundleConfig = {
    ...xrnConfig.bundleConfig,
    bundles: xrnConfig.bundleConfig.bundles.map(
      ({ name, gitUrl, ...rest }) => ({
        bundleName: name,
        ...rest,
      })
    ),
  };

  if (fs.existsSync(harmonyConfigPath)) {
    fs.writeFileSync(
      harmonyConfigPath,
      JSON.stringify(updatedBundleConfig, null, 2),
      "utf8"
    );
  }

  if (fs.existsSync(androidConfigPath)) {
    fs.writeFileSync(
      androidConfigPath,
      JSON.stringify(updatedBundleConfig, null, 2),
      "utf8"
    );
  }
}

postInstall();

writeBundleConfig();
