import { BuildEnv, BuildType, Platform } from "../typing";
import { isProd, padZero } from "../utils";
import semver from "semver";
import { validateVersion } from "../../utlis/validateVersion";
import { validateBaseVersion } from "../utils/versionUtils";

/** 负责本地版本号的计算与校验。 */
export class VersionManager {
  private version: string;
  private versionNumber: string;
  private minSupportedVersion: string;
  private forceUpdate = false;

  constructor(
    private baseVersion: string,
    externalVersion: string,
    private platform: Platform,
    private buildEnv: BuildEnv,
    private buildType: BuildType
  ) {
    this.version = externalVersion || baseVersion;
  }

  init(minSupportedVersionOption: string | undefined): void {
    if (!validateBaseVersion(this.baseVersion)) {
      throw new Error(
        `基准版本号格式错误: ${this.baseVersion}，第三位最多只有两位数（如：3.7.1，3.8.12）`
      );
    }
    if (!this.version) {
      throw new Error("版本号存在问题");
    }
    this.initMinSupportedVersion(minSupportedVersionOption);
  }

  private initMinSupportedVersion(minSupportedVersionOption: string | undefined): void {
    if (minSupportedVersionOption) {
      validateVersion(minSupportedVersionOption, "minSupportedVersion");
      this.minSupportedVersion = minSupportedVersionOption;
      this.forceUpdate = semver.gte(minSupportedVersionOption, this.version);
      return;
    }
    if (isProd(this.buildEnv) && this.buildType === BuildType.RELEASE) {
      throw new Error("生产环境的release包必须传递 --minSupportedVersion 参数");
    }
    this.minSupportedVersion = this.version;
    this.forceUpdate = true;
  }

  private calculateVersionNumber(): string {
    const currentDate = new Date();
    const yearTwoDigits = padZero(currentDate.getFullYear() % 100);
    const month = padZero(currentDate.getMonth() + 1);
    const day = padZero(currentDate.getDate());
    const hour = padZero(currentDate.getHours());
    const minuteGroup = Math.floor(currentDate.getMinutes() / 10).toString();

    if (this.platform === Platform.Android || this.platform === Platform.Harmony) {
      return `${yearTwoDigits}${month}${day}${hour}${minuteGroup}`;
    }

    const timestamp = `${currentDate.getFullYear()}${month}${day}${hour}${padZero(currentDate.getMinutes())}`;
    return this.buildEnv === BuildEnv.prod ? `${timestamp}00` : timestamp;
  }

  getVersion(): string {
    return this.version;
  }

  getBaseVersion(): string {
    return this.baseVersion;
  }

  getVersionNumber(): string {
    if (!this.versionNumber) {
      this.versionNumber = this.calculateVersionNumber();
    }
    return this.versionNumber;
  }

  getMinSupportedVersion(): string {
    return this.minSupportedVersion;
  }

  isForceUpdate(): boolean {
    return this.forceUpdate;
  }
}
