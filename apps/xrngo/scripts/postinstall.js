const fs = require("fs");

const cwd = process.cwd();
const xrnConfigPath = `${cwd}/xrn.config.json`;
const xrnConfig = require(xrnConfigPath);
const bundleConfigPath = `${cwd}/android/app/src/main/res/raw/bundle_config.json`;

fs.writeFileSync(
  bundleConfigPath,
  JSON.stringify(
    {
      ...xrnConfig.bundleConfig,
      bundles: xrnConfig.bundleConfig.bundles.map(({ name, gitUrl, ...rest }) => ({
        bundleName: name,
        ...rest,
      })),
    },
    null,
    2
  ),
  "utf8"
);
