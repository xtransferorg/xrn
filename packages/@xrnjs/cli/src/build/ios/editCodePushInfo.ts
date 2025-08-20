import { execShellCommand } from "../utils/shell";
import { BuildEnv, BuildType, BundleType } from "../typing";
import fs from "fs-extra";
// import { XcodeConfigMode, xcodeprojChange } from "./xcodeproj";
import { buildJobContext } from "../BuildJobContext";
import logger from "../../utlis/logger";
import { getCodePushKeyName } from "../../codePush/utils";
import { checkTool } from "../utils";

const editXml = (filepath: string, key: string, value: string) => {
  let infoPlistContent = fs.readFileSync(filepath, "utf8");
  // 使用正则表达式替换指定的 key 的值
  const regexPattern = new RegExp(
    `(<key>${key}</key>.*?<string>).*?(</string>)`,
    "gs"
  );
  infoPlistContent = infoPlistContent.replace(
    regexPattern,
    (_, prefix, suffix) => `${prefix}${value}${suffix}`
  );
  // 将更新后的内容写回文件
  fs.writeFileSync(filepath, infoPlistContent, "utf8");
};

const editInfoPlist = (key: string, value: string) => {
  const { rootPath, nativeProjectName } = buildJobContext;
  const scheme = nativeProjectName;
  const infoPlistPath = `${rootPath}/ios/${scheme}/Info.plist`;
  editXml(infoPlistPath, key, value);
};

const editXtBundlesPlist = (key: string, value: string) => {
  const { rootPath } = buildJobContext;
  const xtBundlesPlistPath = `${rootPath}/ios/BundleEventCenter/bundleController/xtBundles.plist`;
  editXml(xtBundlesPlistPath, key, value);
};

export async function editCodePushInfo() {
  // 如果 codepush 命令不存在，则不进行修改
  const codePushCommand = await checkTool("code-push");
  if (!codePushCommand) {
    logger.warn("codepush 命令不存在，不进行 CodePush 信息修改");
    return;
  }
  const { buildEnv, buildType, subBundle, rootPath, platform, project } =
    buildJobContext;
  if (buildEnv !== BuildEnv.prod && buildEnv !== BuildEnv.staging) {
    // CodePush 相关变量
    const codePushUrlTest = "http://cp.xtrfr.cn";

    editInfoPlist("CodePushServerURL", codePushUrlTest);

    if (buildType !== BuildType.RELEASE) {
      // 如果不是发布版本，直接退出
      logger.info("非发布版本，不需要修改 CodePush 信息");
      return;
    }
    const mainBundleName =
      subBundle.find((bundleInfo) => bundleInfo.bundleType == BundleType.main)
        ?.name ?? "";
    if (mainBundleName.length == 0) {
      throw new Error("无法找到主bundle");
    }
    const mainCodePushKeyName = getCodePushKeyName({
      bundleName: mainBundleName,
      platform,
      buildEnv,
      project: project,
    });
    const codePushKey = await execShellCommand(
      `code-push deployment list ${mainCodePushKeyName} -k | grep Production | awk -F ' ' '{print $4}'`,
      { cwd: `${rootPath}` }
    );
    // 检查是否缺少 iOS CodePush Key
    if (!codePushKey) {
      logger.warn(`${mainCodePushKeyName} key不存在`);
      return;
    }

    editInfoPlist("CodePushDeploymentKey", codePushKey.trimEnd());

    subBundle.forEach(async (bundleItem) => {
      if (bundleItem.bundleType === BundleType.main) {
        return;
      }
      const codePushKeyName = getCodePushKeyName({
        bundleName: bundleItem.name,
        platform,
        buildEnv,
        project: project,
      });
      const codepush_key: string = await execShellCommand(
        `code-push deployment list ${codePushKeyName} -k | grep Production | awk -F ' ' '{print $4}'`,
        { cwd: `${rootPath}` }
      );
      const pureCodePushKey = codepush_key.trimEnd();
      editXtBundlesPlist(bundleItem.name, pureCodePushKey);
    });
  }
}
