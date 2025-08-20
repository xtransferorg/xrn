/* eslint-disable @typescript-eslint/no-unsafe-argument */
import type { MetaConfig } from "./interface";
import { BuildEnv, BuildType, Platform } from "../typing";
import { execShellCommand } from "../utils/shell";
import { execBuildCore } from "./module";
import { EntryFileName } from "./constant";
import { getBundleName, getFileHash } from "./utils";
import logger from "../../utlis/logger";
import path from "path";
import fs from "fs/promises";
import { isProd } from "../utils";

const GlobalIgnorePackages = ["lottie-ios", "@ant-design/react-native"];

function assertVersion(v: string, name: string) {
  if (/^(\^|~|\*)/.test(v)) {
    // TODO: 临时先 warn，后续需要报错
    logger.warn(`依赖 ${name} 版本号不能使用 ^ ~ *`);
    // throw new Error(`依赖 ${name} 版本号不能使用 ^ ~ *`);
  }
}

interface BuildCommonBundleConfig {
  platform: Platform;
  verbose: boolean;
  version: string;
  project: string;
  base?: string;
  buildEnv: BuildEnv;
  buildType: BuildType;
}

export async function buildCommonBundle({
  platform,
  verbose,
  buildEnv,
  version,
  project,
  buildType,
  base = process.cwd(),
}: BuildCommonBundleConfig): Promise<MetaConfig> {
  const rootPkg = path.join(base, "package.json"); // 原生项目根目录的 package.json
  const pkgJson = require(rootPkg) as {
    dependencies: Record<string, string>;
  };
  for (const key in pkgJson.dependencies) {
    assertVersion(pkgJson.dependencies[key], key);
  }

  // 为了给react-native-svg/css localSvg组件打patch
  const pkgDependencies = {
    ...pkgJson.dependencies,
    "react-native-svg/css": "",
  };
  const content =
    Object.keys(pkgDependencies)
      .filter((key) => !GlobalIgnorePackages.includes(key))
      .sort((a, b) => {
        const hexA = Buffer.from(a).toString("hex");
        const hexB = Buffer.from(b).toString("hex");
        return hexA.localeCompare(hexB);
      })
      .map(
        (key, index) =>
          `import * as a${index} from '${key}';export const b${index} = a${index};`,
      )
      .join("\n") +
    `
import { AppRegistry } from 'react-native';
import App from './App';
AppRegistry.registerComponent('xt-app-404', () => App);
`;

  const basePath = path.resolve(base, "xt-app-common"); // 生成一个临时目录，作为 common 构建的目录
  logger.info(`创建 common bundle 项目，临时目录: ${basePath}`);
  try {
    await fs.rmdir(basePath, { recursive: true });
  } catch {
    //
  }
  await fs.mkdir(basePath, { recursive: true });
  await fs.writeFile(
    path.resolve(basePath, "App.tsx"),
    `import { View, Image, Text, NativeModules } from 'react-native';
export default () => {
  NativeModules?.XRNLoadingModule?.hide?.();
  NativeModules?.XRNPerformanceModule?.uploadSentryError?.(1404, 'common-bundle-error');
  return (
    <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
      <Image style={{ width: 150, height: 115 }} source={require('./assets/error.png')}></Image>
      <Text style={{ padding: 10, fontSize: 16 }}>Unexpected errors occur</Text>
      <Text style={{ padding: 10 }}>Please contact official customer service</Text>
      <Text style={{ padding: 10 }}>TEL: 400-998-9930</Text>
    </View>
  )
}
`,
    "utf-8",
  );
  // 创建空 lock 文件
  await fs.writeFile(path.resolve(basePath, "yarn.lock"), "");
  await fs.mkdir(path.join(basePath, `release_${platform}`), {
    recursive: true,
  });
  await fs.writeFile(path.resolve(basePath, EntryFileName), content);
  await fs.writeFile(
    path.resolve(basePath, "package.json"),
    JSON.stringify({
      dependencies: Object.assign({}, pkgJson.dependencies),
      devDependencies: {
        "@react-native/metro-config": "0.72.12",
        "@sentry/react-native": "4.15.2",
        "babel-plugin-transform-remove-console": "6.9.4",
        "patch-package": "8.0.0",
      },
      scripts: {
        postinstall: "patch-package",
      },
      name: "common",
    }),
  );
  await fs.writeFile(
    path.resolve(basePath, "babel.config.js"),
    `module.exports = {
presets: ['module:metro-react-native-babel-preset'],
plugins: [
  ${
    isProd(buildEnv)
      ? '"transform-remove-console",'
      : "" /* 生产环境移除 console */
  }
  "react-native-reanimated/plugin",
]}`,
  );
  await fs.cp(
    path.resolve(__dirname, "../../../files", "_patches"),
    path.resolve(basePath, "patches"),
    { recursive: true },
  );
  await fs.cp(
    path.resolve(__dirname, "../../../files", "_assets"),
    path.resolve(basePath, "assets"),
    { recursive: true },
  );
  // const basePkg = isExistFile(pkg.get()) && (require(pkg.get()) as PackageJson);

  await execShellCommand(`yarn install`, { cwd: basePath });

  logger.info("开始构建 common bundle");
  const output = path.resolve(basePath, `release_${platform}`);
  await execBuildCore("core/common.js", {
    platform: platform,
    bundleName: getBundleName(platform),
    output: output,
    basePath: basePath,
    verbose: verbose ? "1" : "0",
    dev: buildType === BuildType.DEBUG ? "1" : "0",
    assetsDest:
      platform === Platform.iOS
        ? path.resolve(output)
        : path.resolve(output, "res"),
  });
  logger.info("构建结束 common bundle");

  const metaJson = JSON.parse(
    await fs.readFile(path.resolve(basePath, `${platform}.meta.json`), "utf-8"),
  ) as MetaConfig;

  // 计算 bundle 内容的 hash 并存放在基线中
  const hash = await getFileHash(
    path.resolve(basePath, `release_${platform}`, getBundleName(platform)),
  );

  metaJson.hash = hash;

  // 检查模块是否有版本未找到，未找到则应该报错
  Object.entries(metaJson.modules).some(([key, item]) => {
    if (item.version === "0.0.0") {
      throw new Error(`${key} 版本号不能为 0.0.0`);
    }
  });

  return metaJson;
}
