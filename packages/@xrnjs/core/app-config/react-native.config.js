const { dependencies } = require("../package.json");
const resolveNodeModuleDir = require("@react-native-community/cli-tools/build/resolveNodeModuleDir");

const fs = require("fs");
const path = require("path");

const coreDeps = Object.keys(dependencies).reduce((acc, key) => {
  if (key.startsWith("@react-native-oh")) {
    return acc;
  }

  const appDependencyPath = resolveNodeModuleDir.default(process.cwd(), key);
  if (fs.existsSync(appDependencyPath)) {
    acc[key] = {
      root: appDependencyPath,
      platforms: {},
    };
    return acc;
  }

  const coreModuleDependencyPath = path.join(__dirname, "../node_modules", key);
  if (fs.existsSync(coreModuleDependencyPath)) {
    acc[key] = {
      root: coreModuleDependencyPath,
      platforms: {},
    };
    return acc;
  }

  console.warn(`未找到 ${key} 依赖`);
  return acc;

}, {});

function findHarmonyDir(root) {
  if (fs.existsSync(path.join(root, 'harmony'))) {
    return 'harmony';
  }
  return null;
}

/**
 * Same as projectConfigAndroid except it returns
 * different config that applies to packages only
 */
function harmonyDependencyConfig(root, userConfig = {}) {
  if (userConfig === null) {
    return null;
  }

  const src = userConfig.sourceDir || findHarmonyDir(root);

  if (!src) {
    return null;
  }

  const packageJsonPath = path.join(root, 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    return null;
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const harmony = packageJson.harmony || {};

  const sourceDir = path.join(root, src);

  return {
    sourceDir,
    ...harmony,
  };
}

module.exports = {
  project: {
    ios: {},
    android: {}, // grouped into "project"
  },
  reactNativePath:  './node_modules/react-native',
  dependencies: {
    ...coreDeps,
  },
  platforms: {
    harmony: {
      dependencyConfig: harmonyDependencyConfig,
      projectConfig: () => {
        return {};
      },
    },
  },
}
