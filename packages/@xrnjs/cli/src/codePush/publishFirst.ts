// import { publishJobContext } from "../publish/PublishJobContext";
import { randomUUID } from "crypto";
import { cp, mkdir, writeFile } from "fs/promises";
import { exists, rmdir } from "fs-extra";
import os from "os";
import path from "path";

import { CodePushDeployment } from "./typing";
import { buildJobContext } from "../build/BuildJobContext";
import { getBundleName } from "../build/bundle/utils";
import { BuildEnv, Platform } from "../build/typing";
import { isProd } from "../build/utils";
import { execShellCommand } from "../build/utils/shell";
import logger from "../utlis/logger";

const CODE_PUSH_FILE = "codepush.json";

function generateAppName(name: string, platform: string, buildEnv: BuildEnv) {
  return `${name}-${platform}${isProd(buildEnv) ? "" : `-${buildEnv}`}`;
}

export async function publishFirstCodePush() {
  const {
    rootPath,
    subBundle,
    platform,
    buildEnv,
    version,
    privateKey,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    changeLog = "内置包",
  } = buildJobContext;
  const temp = path.join(os.tmpdir(), randomUUID());
  try {
    const codePushJson = {};
    for (const sub of subBundle) {
      const bundleName = getBundleName(platform, sub.name);
      const outputBundlePath = path.join(temp, sub.name, `release_${platform}`);
      const bundlePath = path.join(
        rootPath,
        sub.name,
        `release_${platform}`,
        bundleName
      );
      await mkdir(outputBundlePath, { recursive: true });
      await cp(bundlePath, path.join(outputBundlePath, bundleName));
      const codePushName = generateAppName(sub.name, platform, buildEnv);
      let mPrivateKey = "";
      if (privateKey) {
        mPrivateKey = `--privateKeyPath "${privateKey}"`;
      }
      const result = await execShellCommand(
        `code-push release ${codePushName} ${outputBundlePath} ${version} -m false --bundleName "${getBundleName(
          platform,
          sub.name
        )}" --des "${changeLog}" -d Production --noDuplicateReleaseError true --appBinaryTime ${Date.now()} ${mPrivateKey}`
      );
      logger.info("第一次发布结果: " + JSON.stringify(result));
      let codePushKey: string, packageHash: string;
      const codePushInfoStr = await execShellCommand(
        `code-push deployment list ${codePushName} --format json --showPackage false`
      );
      const codePushInfo = JSON.parse(
        codePushInfoStr || ""
      ) as CodePushDeployment[];
      codePushInfo.forEach((item) => {
        if (item.name === "Production") {
          codePushKey = item.key;
          packageHash = item.package.packageHash;
        }
      });
      if (!codePushKey) {
        throw new Error(`${codePushName} key不存在`);
      }
      if (!packageHash) {
        throw new Error(`${codePushName} packageHash不存在`);
      }
      codePushJson[codePushKey] = {
        basePackageHash: packageHash,
      };
    }
    if (platform === Platform.iOS) {
      const dir = path.join(rootPath, "HDiffPatch");
      if (!(await exists(dir))) {
        await mkdir(dir, { recursive: true });
      }
      await writeFile(
        path.join(dir, CODE_PUSH_FILE),
        JSON.stringify(codePushJson, null, 2),
        "utf-8"
      );
    } else {
      await writeFile(
        path.join(rootPath, "android/app/src/main/assets", CODE_PUSH_FILE),
        JSON.stringify(codePushJson, null, 2),
        "utf-8"
      );
    }
  } finally {
    await deleteFolderRecursive(temp);
  }
}
async function deleteFolderRecursive(temp: any) {
  if (await exists(temp)) {
    await rmdir(temp, { recursive: true });
  }
}
