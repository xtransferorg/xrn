import { execShellCommand } from "../utils/shell";
import { BuildEnv, BuildType, BundleType } from "../typing";
import fs from "fs-extra";
import { XcodeConfigMode, xcodeprojChange } from "./xcodeproj";
import { buildJobContext } from "../BuildJobContext";
import logger from "../../utlis/logger";
import { deserializeConnectionInfo } from "@xrnjs/code-push-cli";

export async function editCodePushInfo(scheme: string) {
  const {
    buildEnv,
    buildType,
    subBundle,
    rootPath,
  } = buildJobContext;
  if (buildEnv !== BuildEnv.prod && buildEnv !== BuildEnv.staging) {

    const info = deserializeConnectionInfo()
    // CodePush 相关变量
    const codePushUrlTest = info?.customServerUrl;

    // 将 CodePushServerURL 字段替换为测试 URL
    let infoPlistContent = fs.readFileSync(
      `${rootPath}/ios/${scheme}/Info.plist`,
      "utf8"
    );
    infoPlistContent = infoPlistContent.replace(
      /(<key>CodePushServerURL<\/key>.*?<string>).*?(<\/string>)/gs,
      (_, prefix, suffix) => `${prefix}${codePushUrlTest}${suffix}`
    );
    // 将更新后的内容写回文件
    fs.writeFileSync(
      `${rootPath}/ios/${scheme}/Info.plist`,
      infoPlistContent,
      "utf8"
    );

    logger.info("=============  修改 其他 配置  =============");
    // 通过code - push 相关命令 获取 staging 和 release 的key
    // 获取主bundle的codePush key，只有在release环境下，才需要修改codepush 相关配置
    if (buildType === BuildType.RELEASE) {
      const mainBundleName =
        subBundle.find((bundleInfo) => bundleInfo.bundleType == BundleType.main)
          ?.name ?? "";
      if (mainBundleName.length == 0) {
        throw new Error("无法找到主bundle");
      }
      const code_push_ios_key_release_test = await execShellCommand(
        `code-push deployment list ${mainBundleName}-ios-${buildEnv} -k | grep Production | awk -F ' ' '{print $4}'`,
        { cwd: `${rootPath}` }
      );
      const code_push_ios_key_staging_test = await execShellCommand(
        `code-push deployment list ${mainBundleName}-ios-${buildEnv} -k | grep Staging | awk -F ' ' '{print $4}'`,
        { cwd: `${rootPath}` }
      );
      // 检查是否缺少 iOS CodePush Key
      if (!code_push_ios_key_release_test) {
        console.log("key 不存在")
      }

      logger.info("Replace CodePush keys...");

      await xcodeprojChange(
        XcodeConfigMode.Release,
        "MAIN_CODEPUSH_KEY",
        code_push_ios_key_release_test.trimEnd()
      );
      await xcodeprojChange(
        XcodeConfigMode.Staging,
        "MAIN_CODEPUSH_KEY",
        code_push_ios_key_staging_test.trimEnd()
      );

      logger.info("Done!");

      logger.info("Replace CodePush URL...");

      // 替换sub bundle code push key
      // 读取 ios/scheme/Info.plist 文件内容
      let subBundlePlistContent = fs.readFileSync(
        `${rootPath}/ios/BundleEventCenter/bundleController/xtBundles.plist`,
        "utf8"
      );
      // 获取 子bundle的code push key
      //let serviceCodePushMap: { [key: string]: string } = {}
      for (let index = 0; index < subBundle.length; index++) {
        const bundleService = subBundle[index];
        if (bundleService.name === mainBundleName) {
          continue;
        } else {
          // 子bundle
          // const bundleServiceName = getRealBundleName(bundleService.name, mainBundleName)
          const codepush_key: string = await execShellCommand(
            `code-push deployment list ${bundleService.name}-ios-${buildEnv} -k | grep Production | awk -F ' ' '{print $4}'`,
            { cwd: `${rootPath}` }
          );
          const pureCodePushKey = codepush_key.trimEnd();
          const regexPattern = new RegExp(
            `(<string>${bundleService.name}</string>.*?<key>codePushKey</key>.*?<string>).*?(</string>)`,
            "gs"
          );
          subBundlePlistContent = subBundlePlistContent.replace(
            regexPattern,
            (_, prefix, suffix) => `${prefix}${pureCodePushKey}${suffix}`
          );
          //subBundlePlistContent = subBundlePlistContent.replace(/(<string>xt-app-user<\/string>.*?<key>codePushKey<\/key>.*?<string>).*?(<\/string>)/gs, (_, prefix, suffix) => `${prefix}${codePushUrlTest}${suffix}`);
          //serviceCodePushMap[bundleService.name] = codepush_key
        }
      }
      fs.writeFileSync(
        `${rootPath}/ios/BundleEventCenter/bundleController/xtBundles.plist`,
        subBundlePlistContent,
        "utf8"
      );
    }
  }
}
