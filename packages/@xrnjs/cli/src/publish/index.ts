import { build } from "../build";
import { publishJobContext } from "./PublishJobContext";
import { CodePushReleaseData, CodePushResp } from "./publishTypes";
import { buildJobContext } from "../build/BuildJobContext";
import { NativeAppVersionStatus } from "../rollout/types";
import { MyOSSClient } from "./utils/oss";
import { BuildType, Platform } from "../build/typing";
import { convertPlatform, isProd } from "../build/utils";
import { cleanBaseLineFile, generateAndUploadBaseline } from "../codePush/diff";
import logger from "../utlis/logger";
import request from "../utlis/request";

/** 发布 */
export const appPublish = async () => {
  const { channel, changeLog, uploadToOSS, rootPath } = publishJobContext;

  if (!changeLog) {
    logger.error("changeLog 不能为空");
    process.exit(1);
  }
  await cleanBaseLineFile(rootPath);

  const ossClient = new MyOSSClient();

  if (uploadToOSS) {
    ossClient.init();
  }

  const buildResults = await build();

  for (const result of buildResults) {
    await appPublishSingleChannel({
      channel: result.channel || channel,
      ossClient,
      appFtpLink: result.link,
      appLocalFilePath: result.filePath,
    });
  }
};

/** 发布一个渠道 */
const appPublishSingleChannel = async ({
  channel,
  ossClient,
  appFtpLink,
  appLocalFilePath,
}: {
  channel: string;
  ossClient: MyOSSClient;
  appFtpLink: string;
  appLocalFilePath: string;
}) => {
  const {
    project,
    version,
    changeLog,
    isBackwardCompatible,
    updateType,
    onlyApplyVersion,
    appKey,
    uploadToOSS,
    platform,
    buildEnv,
    appFormat,
    notOnlyApplyVersion,
    buildType,
  } = publishJobContext;

  let downloadUrl = appFtpLink;

  // 上传 apk 到 oss

  const channelPaths = {
    china: "apks",
    chinaNew: "newapks",
  };

  if (
    platform === Platform.Android &&
    channelPaths[channel] &&
    appLocalFilePath &&
    uploadToOSS
  ) {
    const ossUrl = await ossClient.uploadFileToOSS(
      appLocalFilePath,
      `/boss/static/${
        channelPaths[channel]
      }/${version}/${Date.now()}/${project}_${version}.apk`,
    );
    downloadUrl = ossUrl;
  }

  if (platform === Platform.iOS && isProd(buildEnv)) {
    downloadUrl =
      "itms-apps://itunes.apple.com/app/apple-store/id1463736500?mt=8";
  }

  // app 发布

  const versionNumber = buildJobContext.getVersionNumber();

  const codePushParams = {
    name: project,
    platform: convertPlatform(platform),
    download_url: downloadUrl,
    version_name: version,
    change_log: changeLog,
    is_backward_compatible: isBackwardCompatible,
    environment: buildEnv,
    update_type: updateType,
    channel,
    only_apply_version: onlyApplyVersion,
    status: NativeAppVersionStatus.ReadyForReview,
    rollout: "0",
    version_number: versionNumber,
    app_format: appFormat,
    not_only_apply_version: notOnlyApplyVersion,
    // build_type,
    app_type: buildType === BuildType.RELEASE ? "Release" : "Debug",
  };

  try {
    const resp = await request.post<CodePushResp<CodePushReleaseData>>(
      "/xrn/app/publish",
      codePushParams,
    );
    logger.info("发布接口响应：" + JSON.stringify(resp.data));
    if (resp.data.code !== 0) {
      logger.error("发布失败");
      logger.error(resp.data);
      process.exit(1);
    }
    logger.info(`下载地址：${resp.data?.data?.download_url}`);
  } catch (error) {
    logger.error("发布接口调用失败", error);
    process.exit(1);
  }

  logger.info("开始生成并上传基线文件");
  await generateAndUploadBaseline();

  logger.info(`发布 ${channel} 成功`);
};
