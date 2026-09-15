import { buildJobContext } from "../BuildJobContext";
import { execShellCommand } from "../utils/shell";
import fsExtra from "fs-extra";
import logger from "../../utlis/logger";

import json5 from "json5";

import { isProd } from "../utils";
import fs from "fs-extra";
import ora from "ora";
import { deserializeConnectionInfo } from "@xrnjs/code-push-cli";

function getCodePushServerUrl() {
  const info = deserializeConnectionInfo();
  return info?.customServerUrl;
}

function editEnvFile(codePushServerUrl: string) {
  const { buildEnv, rootPath, appKey } = buildJobContext;
  const currentEnvDotFile = `${rootPath}/.env`;
  let envStagingContent = fs.readFileSync(currentEnvDotFile, "utf8");

  // 修改 ENV_NAME 为 buildEnv
  envStagingContent = envStagingContent.replace(
    /ENV_NAME=.*/,
    `ENV_NAME=${buildEnv}`
  );

  envStagingContent = envStagingContent.replace(
    /APP_KEY=.*/,
    `APP_KEY=${appKey}`
  );

  const nextEnvContent = envStagingContent.replace(
    /CODEPUSH_URL=.*/,
    `CODEPUSH_URL=${codePushServerUrl}`
  );
  envStagingContent =
    nextEnvContent === envStagingContent
      ? `${envStagingContent.trimEnd()}\nCODEPUSH_URL=${codePushServerUrl}\n`
      : nextEnvContent;
  fs.writeFileSync(currentEnvDotFile, envStagingContent, "utf8");
  return currentEnvDotFile;
}

function editBuildProfileServerUrl(codePushServerUrl: string) {
  const { rootPath } = buildJobContext;
  const buildProfilePath = `${rootPath}/harmony/build-profile.json5`;
  const buildProfileContent = fs.readFileSync(buildProfilePath, "utf8");
  const updatedContent = buildProfileContent.replace(
    /(["']ServerUrl["']\s*:\s*["'])[^\n"']*(["'])/g,
    `$1${codePushServerUrl}$2`
  );
  fs.writeFileSync(buildProfilePath, updatedContent, "utf8");
}

async function editCodePushKey(bundleName: string) {
  const { buildEnv, rootPath, platform } = buildJobContext;
  const codepushKeyLoading = ora().start(`修改${bundleName}的codePushKey`);
  const codePushName = `${bundleName}-${platform}-${buildEnv}`; // 生产环境不需要修改

  const codePushKey = await execShellCommand(
    `code-push deployment list ${codePushName} -k | grep Production | awk -F ' ' '{print $4}'| tr -d '\n'`
  );
  if (!codePushKey) {
    console.log("key 不存在")
  }
  const codePushKeyName = `CODEPUSH_${bundleName
    .toLocaleUpperCase()
    .replace(/-/g, "_")}_KEY`;
  const rex = `'s/${codePushKeyName}=.*/${codePushKeyName}=${codePushKey}/'`;
  await execShellCommand(`sed -i "" ${rex} .env`, {
    cwd: `${rootPath}`,
  });

  codepushKeyLoading.succeed(bundleName + " : " + codePushKey);
}

const editAppJson = () => {
  const { version: versionName, rootPath } = buildJobContext;
  const versionCode = buildJobContext.getVersionNumber();
  const appJsonPath = `${rootPath}/harmony/AppScope/app.json5`;
  const appJson = json5.parse(fsExtra.readFileSync(appJsonPath, "utf-8"));
  appJson.app.versionName = versionName;
  appJson.app.versionCode = Number(versionCode);
//   appJson.app.bundleName = buildType === BuildType.DEBUG ? "com.xtapp.xtransfer.dev" : "com.xtapp.xtransfer";
  fsExtra.writeFileSync(appJsonPath, json5.stringify(appJson, null, 2));
};

const editUmConfig = () => {
  const { rootPath, buildEnv } = buildJobContext;
  const umJsonPath = `${rootPath}/harmony/AppScope/resources/rawfile/umconfig.json`;
  const umJson = JSON.parse(fsExtra.readFileSync(umJsonPath, "utf-8"));
  umJson.appKey = isProd(buildEnv) ? "6801f0d479267e02103e61b4" : "67b68ca5db52393481f66983";
  fsExtra.writeFileSync(umJsonPath, JSON.stringify(umJson, null, 2));
};

const editCommonHash = () => {
  const { rootPath, meta } = buildJobContext;
  if (!meta?.hash) {
    logger.warn("[editCommonHash] meta 或 meta.hash 为空，跳过 commonHash 写入");
    return;
  }
  const buildProfilePath = `${rootPath}/harmony/build-profile.json5`;
  const buildProfileContent = fs.readFileSync(buildProfilePath, "utf8");
  const updatedContent = buildProfileContent.replace(
    /(["']commonHash["']\s*:\s*["'])[^\n"']*(["'])/g,
    `$1${meta.hash}$2`
  );
  fs.writeFileSync(buildProfilePath, updatedContent, "utf8");
};

/**
 * 修复 node_modules 中 yalc 安装的 harmony 子模块 oh-package.json5 里
 * 指向 monorepo packages 的相对路径。
 *
 * 这些包在 monorepo 源码中用 `../../../../packages/<pkg>/...` 引用同级包，
 * 但被 yalc 安装到 xrngo 的 node_modules 后，布局变为
 * `node_modules/<pkg>/harmony/<module>/`，需要改用 `../../../<pkg>/...`
 * 指向 `node_modules/<pkg>/...`。否则 ohpm install 会因路径不存在而失败。
 */
const fixHarmonyModulePaths = () => {
  const { rootPath } = buildJobContext;
  const nodeModulesPath = `${rootPath}/node_modules`;
  if (!fs.existsSync(nodeModulesPath)) {
    return;
  }
  const ohPackageFiles: string[] = [];
  const collectOhPackages = (dir: string) => {
    let names: string[];
    try {
      names = fs.readdirSync(dir);
    } catch {
      return;
    }
    for (const name of names) {
      const full = `${dir}/${name}`;
      let stat;
      try {
        stat = fs.statSync(full);
      } catch {
        continue;
      }
      if (stat.isDirectory()) {
        if (name === "harmony") {
          let moduleNames: string[];
          try {
            moduleNames = fs.readdirSync(full);
          } catch {
            continue;
          }
          for (const moduleName of moduleNames) {
            const ohPkg5 = `${full}/${moduleName}/oh-package.json5`;
            const ohPkg = `${full}/${moduleName}/oh-package.json`;
            const ohLock5 = `${full}/${moduleName}/oh-package-lock.json5`;
            const ohLock = `${full}/${moduleName}/oh-package-lock.json`;
            for (const p of [ohPkg5, ohPkg, ohLock5, ohLock]) {
              if (fs.existsSync(p)) {
                ohPackageFiles.push(p);
              }
            }
          }
        } else {
          collectOhPackages(full);
        }
      } else if (
        name === "oh-package.json5" ||
        name === "oh-package.json" ||
        name === "oh-package-lock.json5" ||
        name === "oh-package-lock.json"
      ) {
        ohPackageFiles.push(full);
      }
    }
  };
  collectOhPackages(nodeModulesPath);

  let fixedCount = 0;
  for (const file of ohPackageFiles) {
    let content: string;
    try {
      content = fs.readFileSync(file, "utf8");
    } catch {
      continue;
    }
    // `../../../../packages/<pkg>/...` -> `../../../<pkg>/...`
    // `../../../packages/<pkg>/...` -> `../../../<pkg>/...`（统一向上 3 级到 node_modules）
    let updated = content.replace(
      /(\.\.\/){2,}packages\/(@[^/]+\/[^/]+|[^/]+)\//g,
      "../../../$2/"
    );
    // 修复 `file:` 后多层 `../` 且未指向 node_modules 的路径，
    // 统一改为 `file:../../../<pkg>/...`（向上 3 级到 node_modules）
    updated = updated.replace(
      /file:(\.\/)*(\.\.\/)+(?!node_modules)(@[^/]+\/[^/]+|[^/]+)\//g,
      "file:../../../$3/"
    );
    if (updated !== content) {
      fs.writeFileSync(file, updated, "utf8");
      fixedCount++;
      logger.info(`[fixHarmonyModulePaths] 修正路径: ${file}`);
    }
  }
  if (fixedCount > 0) {
    logger.info(
      `[fixHarmonyModulePaths] 共修正 ${fixedCount} 个 oh-package 文件的相对路径`
    );
  }
};

export const editFile = async () => {
  const { buildEnv, subBundle, rootPath } = buildJobContext;
  editAppJson();
  editUmConfig();
  editCommonHash();
  fixHarmonyModulePaths();
  if (!isProd(buildEnv)) {
    const codePushServerUrl = getCodePushServerUrl();
    editBuildProfileServerUrl(codePushServerUrl);
    for (let index = 0; index < subBundle.length; index++) {
      const bundleItem = subBundle[index];
      await editCodePushKey(bundleItem.name);
    }
    // 在 debug 包中把 gradle.properties 文件中的 enableHermes=false 改为 enableHermes=true
    editEnvFile(codePushServerUrl);
  } else {
    fs.copyFileSync(`${rootPath}/.env.prod`, `${rootPath}/.env`)
  }
};
