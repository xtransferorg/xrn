import logger from "../utlis/logger";
import { BuildJobContext } from "../build/BuildJobContext";
import { PublishCommandOptions } from "./publishTypes";
import { BuildEnv } from "../build/typing";

export class PublishJobContext {
  /** Changelog of the release */
  changeLog: string;

  /** Is the release backward compatible */
  isBackwardCompatible: boolean;

  /** Update type of the release. force or silent */
  updateType: "Force" | "Silent";

  /** Only apply the release to the specified version */
  onlyApplyVersion: string;

  uploadToOSS: boolean;

  /** 如果设置了此参数，表示除了此版的App都能收到本次更新 */
  notOnlyApplyVersion: string;

  buildContext: BuildJobContext;

  /** 是否构建测试环境生产稳定版本app */
  initPublish(
    buildContext: BuildJobContext,
    {
      changeLog,
      isBackwardCompatible,
      updateType,
      onlyApplyVersion,
      uploadToOSS = buildContext.buildEnv === BuildEnv.prod ? "true" : "false",
      notOnlyApplyVersion,
    }: PublishCommandOptions
  ) {
    this.buildContext = buildContext;
    this.changeLog = changeLog;
    this.isBackwardCompatible = isBackwardCompatible === "true";
    this.updateType = updateType;
    this.onlyApplyVersion = onlyApplyVersion;
    this.notOnlyApplyVersion = notOnlyApplyVersion;
    this.uploadToOSS = uploadToOSS === "true";

    return this;
  }

  getPublishContextReport() {
    const baseReport = [
      this.buildContext.getBuildContextReport(),
      `changeLog: ${this.changeLog}`,
      `isBackwardCompatible: ${this.isBackwardCompatible}`,
      `updateType: ${this.updateType}`,
      `onlyApplyVersion: ${this.onlyApplyVersion}`,
    ];

    if (this.buildContext.minSupportedVersion) {
      baseReport.push(
        `minSupportedVersion: ${this.buildContext.minSupportedVersion}`
      );
    }

    return baseReport.join("\n");
  }

  logInfo() {
    logger.info("发布参数：\n", this.getPublishContextReport());
  }
}

export const publishJobContext = new PublishJobContext();
