import { PublishCommandOptions } from "./publishTypes";
import { BuildJobContext } from "../build/BuildJobContext";
import { BuildEnv } from "../build/typing";
import logger from "../utlis/logger";

export class PublishJobContext extends BuildJobContext {
  /** Changelog of the release */
  changeLog: string;

  /** Is the release backward compatible */
  isBackwardCompatible: boolean;

  /** Update type of the release. force or silent */
  updateType: "force" | "silent";

  /** Only apply the release to the specified version */
  onlyApplyVersion: string;

  uploadToOSS: boolean;

  /** 如果设置了此参数，表示除了此版的App都能收到本次更新 */
  notOnlyApplyVersion: string;

  initPublish({
    changeLog,
    isBackwardCompatible,
    updateType,
    onlyApplyVersion,
    uploadToOSS = this.buildEnv === BuildEnv.prod ? "true" : "false",
    notOnlyApplyVersion,
  }: PublishCommandOptions) {
    this.changeLog = changeLog;
    this.isBackwardCompatible = isBackwardCompatible === "true";
    this.updateType = updateType;
    this.onlyApplyVersion = onlyApplyVersion;
    this.notOnlyApplyVersion = notOnlyApplyVersion;
    this.uploadToOSS = uploadToOSS === "true";
    return this;
  }

  getPublishContextReport() {
    return [
      this.getBuildContextReport(),
      `changeLog: ${this.changeLog}`,
      `isBackwardCompatible: ${this.isBackwardCompatible}`,
      `updateType: ${this.updateType}`,
      `onlyApplyVersion: ${this.onlyApplyVersion}`,
    ].join("\n");
  }

  logInfo() {
    logger.info("发布参数：\n", this.getPublishContextReport());
  }
}

export const publishJobContext = new PublishJobContext();
