import moment from "moment";
import { buildJobContext } from "../BuildJobContext";
import { execInherit, execShellCommand } from "../utils/shell";
import fsExtra from "fs-extra";
import { editFile } from "./editFile";
import { isProd } from "../utils";
import { AppFormat, BuildType } from "../typing";
import { uploadHarmonySourceMap } from "./uploadSource";
import logger from "../../utlis/logger";

export const buildHarmony = async () => {
  const { rootPath, buildType, buildEnv, appFormat } = buildJobContext;

  const harmonyDirectory = `${rootPath}/harmony`;

  await editFile();

  await execShellCommand("ohpm clean", {
    cwd: harmonyDirectory,
  });

  await execShellCommand("ohpm install", {
    cwd: harmonyDirectory,
  });

  logger.info("执行 React Native codegen-harmony...");
  try {
    await execInherit(
      "npx react-native codegen-harmony --cpp-output-path ./harmony/entry/src/main/cpp/generated --rnoh-module-path ./harmony/entry/oh_modules/@rnoh/react-native-openharmony",
      {
        cwd: rootPath,
      }
    );
    logger.info("✅ React Native codegen-harmony 执行成功");
  } catch (error) {
    logger.error("❌ React Native codegen-harmony 执行失败:", error);
    throw error;
  }

  const product = (() => {
    if (isProd(buildEnv)) {
      return "prod";
    } else if (appFormat === AppFormat.app) {
      return "prodInner";
    } else {
      return buildType === BuildType.RELEASE ? "dev" : "default";
    }
  })();

  const hvigrowCommand = `/Applications/DevEco-Studio.app/Contents/tools/node/bin/node /Applications/DevEco-Studio.app/Contents/tools/hvigor/bin/hvigorw.js`
  // 使用 --no-daemon 避免 hvigor daemon websocket 连接在某些环境下失败（EADDRNOTAVAIL 127.0.0.1）
  const daemonFlag = process.env.XRN_HVIGOR_DAEMON === "true" ? "--daemon" : "--no-daemon";

  await execShellCommand(
    `${hvigrowCommand} --sync -p product=${product} --analyze=normal --parallel --incremental ${daemonFlag}`,
    {
      cwd: harmonyDirectory,
    }
  );

  const isApp = appFormat === AppFormat.app;
  const mode = isApp ? "project" : "module";
  const assembleCommand = isApp ? "assembleApp" : "assembleHap";
  const command = `${hvigrowCommand} --mode ${mode} -p product=${product} -p buildMode=${buildType} ${assembleCommand} --analyze=normal --parallel --incremental ${daemonFlag}`;
  await execShellCommand(command, { cwd: harmonyDirectory });
  const relativePath = `outputs/${product}/${
    isApp ? "harmony" : "entry"
  }-${product}-signed.${appFormat}`;
  const oldPath = isApp
    ? `${harmonyDirectory}/build/${relativePath}`
    : `${harmonyDirectory}/entry/build/${product}/${relativePath}`;

  const customName = `v${buildJobContext.version}_${moment().format(
    "YYYY-MM-DD_HH:mm:ss"
  )}_${buildJobContext.buildEnv}_${buildJobContext.project}_${
    buildJobContext.buildType
  }.${appFormat}`;

  const newPath = `${rootPath}/${customName}`;

  await uploadHarmonySourceMap(product);

  // 复制文件
  await fsExtra.copy(oldPath, newPath);
  return { filePath: newPath, fileName: customName };
};
