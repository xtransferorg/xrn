import moment from "moment";
import { buildJobContext } from "../BuildJobContext";
import { execShellCommand } from "../utils/shell";
import fsExtra from "fs-extra";
import { editFile } from "./editFile";
import { isProd } from "../utils";
import { AppFormat, BuildType } from "../typing";

export const buildHarmony = async () => {
  const { rootPath, buildType, buildEnv, appFormat, isSec } = buildJobContext;

  const harmonyDirectory = `${rootPath}/harmony`;


  await editFile();

  // await execShellCommand("ohpm clean", {
  //   cwd: harmonyDirectory,
  // });

  await execShellCommand("ohpm install", {
    cwd: harmonyDirectory,
    oraName: "安装 Harmony 依赖",
  });

  await execShellCommand(
    "npx patch-package && npx react-native codegen-harmony --cpp-output-path ./harmony/entry/src/main/cpp/generated --rnoh-module-path ./harmony/entry/oh_modules/@rnoh/react-native-openharmony",
    {
      cwd: rootPath,
    }
  );

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

  await execShellCommand(
    `${hvigrowCommand} --sync -p product=${product} --analyze=normal --parallel --incremental --daemon`,
    {
      cwd: harmonyDirectory,
      oraName: "同步 Harmony 依赖",
    }
  );

  const isApp = appFormat === AppFormat.app;
  const mode = isApp ? "project" : "module";
  const assembleCommand = isApp ? "assembleApp" : "assembleHap";
  const command = `${hvigrowCommand} --mode ${mode} -p product=${product} -p buildMode=${buildType} ${assembleCommand} --analyze=normal --parallel --incremental --daemon`;
  await execShellCommand(command, { cwd: harmonyDirectory, oraName: "打包 Harmony" });
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

  // 复制文件
  await fsExtra.copy(oldPath, newPath);
  return { filePath: newPath, fileName: customName };
};
