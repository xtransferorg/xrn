import { build } from "../build";
import logger from "../utlis/logger";
import { publishJobContext } from "./PublishJobContext";
import { NativeAppVersionStatus } from "../rollout/types";
import { MyOSSClient } from "./utils/oss";
import { AppFormat, Platform } from "../build/typing";
import { isProd } from "../build/utils";
import { ChannelFileMetadata } from "../build/builders/BaseBuilder";
import fs from "fs-extra";
import { nativeAppSdk } from "@xrnjs/code-push-cli";

/** 发布 */
export const appPublish = async () => {
  const { changeLog, uploadToOSS } = publishJobContext;

  if (!changeLog) {
    logger.error("changeLog 不能为空");
    process.exit(1);
  }

  const ossClient = new MyOSSClient();

  if (uploadToOSS) {
    ossClient.init();
  }

  const buildResults = await build();

  logger.info("buildResults: " + JSON.stringify(buildResults, null, 2));

  // 按渠道分组所有产物
  const channelMap = new Map();
  for (const result of buildResults) {
    if (!channelMap.has(result.channel)) channelMap.set(result.channel, []);
    channelMap.get(result.channel).push(result);
  }


  for (const [channel, results] of channelMap.entries()) {
    await appPublishSingleChannel({
      channel,
      ossClient,
      buildResults: results,
    });
  }
};

/** 发布一个渠道，支持多架构包 */
const appPublishSingleChannel = async ({
  channel,
  ossClient,
  buildResults,
}: {
  channel: string;
  ossClient: MyOSSClient;
  buildResults: ChannelFileMetadata[];
}) => {
  const {
    changeLog,
    isBackwardCompatible,
    updateType,
    onlyApplyVersion,
    uploadToOSS,
    notOnlyApplyVersion,
    buildContext,
  } = publishJobContext;
  const {
    project,
    version,
    appKey,
    platform,
    buildEnv,
    buildType,
    meta,
    packageJson,
    minSupportedVersion,
  } = buildContext;

  let appFormat = buildContext.appFormat;

  // 先区分各架构包
  let downloadUrl = "";
  let downloadUrlArm64 = "";
  let downloadUrlV7a = "";

  let packageSize = 0;

  for (const res of buildResults) {
    let ossUrl = res.link;
    if (res.filePath && uploadToOSS) {
      if (res.filePath.endsWith(".aab")) {
        appFormat = AppFormat.aab;
      } else if (res.filePath.endsWith(".apk")) {
        appFormat = AppFormat.apk;
      }
      const ossPath = `/boss/static/${channel}/${version}/${Date.now()}/${project}_${version}_${
        res.arch || appFormat
      }.${appFormat}`;
      ossUrl = await ossClient.uploadFileToOSS(res.filePath, ossPath);
    }
    const stat = await fs.stat(res.filePath);
    if (res.arch === "universal") {
      downloadUrl = ossUrl;
      packageSize = stat.size;
    } else if (res.arch === "arm64-v8a") {
      downloadUrlArm64 = ossUrl;
    } else if (res.arch === "armeabi-v7a") {
      downloadUrlV7a = ossUrl;
    } else {
      downloadUrl = ossUrl;
      packageSize = stat.size;
    }
  }

  if (platform === Platform.iOS && isProd(buildEnv)) {
    downloadUrl =
      "itms-apps://itunes.apple.com/app/apple-store/id1463736500?mt=8";
  }

  // app 发布

  const versionNumber = buildContext.getVersionNumber();

  const codePushParams = {
    app_key: appKey,
    download_url: downloadUrl,
    download_url_arm64: downloadUrlArm64,
    download_url_arm32: downloadUrlV7a,
    version_name: version,
    changelog: changeLog,
    is_backward_compatible: isBackwardCompatible,
    environment: buildEnv,
    update_type: updateType,
    channel,
    platform,
    only_apply_version: onlyApplyVersion,
    status: NativeAppVersionStatus.ReadyForReview,
    rollout: 0,
    version_number: versionNumber,
    app_format: appFormat,
    not_only_apply_version: notOnlyApplyVersion,
    build_type: buildType,
    ...(minSupportedVersion && { min_supported_version: minSupportedVersion }),
    ...(packageJson.dependencies["@xrnjs/core"] && {
      core_version: packageJson.dependencies["@xrnjs/core"],
    }),
    common_hash: meta.hash,
    package_size: packageSize,
  };

  try {
    await nativeAppSdk.publishNativeApp(codePushParams);

  } catch (error) {
    logger.error("发布接口调用失败", error);
    process.exit(1);
  }

};
