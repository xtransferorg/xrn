import logger from "../../utlis/logger";
import { DepInfo, Platform } from "../typing";
import { getHarmonyPackageByAliasMap } from "./getHarmonyPackageByAliasMap";
import assert from "assert";
import semver from "semver";
import {
  filterNativeDeps,
  getAllNativeDeps,
  loadReactNativeConfigDeps,
} from "./package";
import path from "path";
import fs from "fs-extra";

interface CheckDepParams {
  bundlePath: string;
  bundleName: string;
  nativeDeps: Record<string, DepInfo>;
  platform: Platform;
  reactNativeConfigDeps: Record<string, DepInfo>;
  checkLevel: "major" | "minor" | "patch" | "strict";
  allowNewPackage: boolean;
  allowBundleVersionLowerThanNative?: boolean;
  dependencies?: Record<string, string>;
}

export class BundleDependencies {
  private bundlePath: string;
  private bundleName: string;
  private nativeDeps: Record<string, DepInfo>;
  private platform: Platform;
  private reactNativeConfigDeps: Record<string, DepInfo>;
  private checkLevel: "major" | "minor" | "patch" | "strict";
  private allowNewPackage: boolean;
  private allowBundleVersionLowerThanNative: boolean;
  constructor(params: CheckDepParams) {
    this.bundlePath = params.bundlePath;
    this.bundleName = params.bundleName;
    this.nativeDeps = params.nativeDeps;
    this.platform = params.platform;
    this.checkLevel = params.checkLevel;
    this.allowNewPackage = params.allowNewPackage;
    this.allowBundleVersionLowerThanNative =
      params.allowBundleVersionLowerThanNative ?? false;
    if (params.reactNativeConfigDeps) {
      this.reactNativeConfigDeps = filterNativeDeps(
        params.reactNativeConfigDeps,
        params.platform
      );
    } else if (params.dependencies) {
      this.convertDependencies(params);
    }
  }

  private convertDependencies(params: CheckDepParams) {
    // 适配老的 dependencies 字段
    this.reactNativeConfigDeps = Object.entries(params.dependencies).reduce(
      (acc, [key, value]) => {
        acc[key] = {
          name: key,
          version: value,
          platforms: {
            android: {},
            ios: {},
            harmony: {},
          },
        };
        return acc;
      },
      {} as Record<string, DepInfo>
    );
  }

  private isSecondPartyPackage(name: string): boolean {
    return name.startsWith("xrn-") || name.startsWith("xt");
  }

  private areVersionsCompatible(
    depName: string,
    nativeVersion: string,
    bundleVersion: string
  ): boolean {
    const isSecondParty = this.isSecondPartyPackage(depName);
    try {
      const nativeSemver = semver.coerce(nativeVersion);
      const bundleSemver = semver.coerce(bundleVersion);

      if (!nativeSemver || !bundleSemver) {
        return isSecondParty ? true : nativeVersion === bundleVersion;
      }

      if (!isSecondParty) {
        return nativeVersion === bundleVersion;
      }

      let isCompatible = false;
      switch (this.checkLevel) {
        case "major":
          isCompatible =
            semver.major(nativeSemver) === semver.major(bundleSemver);
          break;
        case "minor":
          isCompatible =
            semver.major(nativeSemver) === semver.major(bundleSemver) &&
            semver.minor(nativeSemver) === semver.minor(bundleSemver);
          break;
        case "patch":
          isCompatible =
            semver.major(nativeSemver) === semver.major(bundleSemver) &&
            semver.minor(nativeSemver) === semver.minor(bundleSemver) &&
            semver.patch(nativeSemver) === semver.patch(bundleSemver);
          break;
        case "strict":
          isCompatible = nativeVersion === bundleVersion;
          break;
        default:
          throw new Error(`不支持的校验级别: ${this.checkLevel as string}`);
      }

      if (!isCompatible) {
        return false;
      }

      if (
        !this.allowBundleVersionLowerThanNative &&
        semver.lt(bundleSemver, nativeSemver)
      ) {
        return false;
      }

      return true;
    } catch (error) {
      return nativeVersion === bundleVersion;
    }
  }

  private async checkHarmonyDeps() {
    const map = getHarmonyPackageByAliasMap(this.bundlePath);
    const { nativeDeps: bundlePackageDeps, duplicateDeps } = getAllNativeDeps(
      this.bundlePath,
      [Platform.Android, Platform.iOS, Platform.Harmony]
    );

    let checkError = !!duplicateDeps.length;

    for (const [name, value] of Object.entries(bundlePackageDeps)) {
      const { android, ios, harmony } = value?.platforms || {};
      if (android || ios || harmony) {
        const bundleDep = bundlePackageDeps[name];
        const nativeDep = this.nativeDeps[name];

        if (!nativeDep) {
          if (!this.allowNewPackage) {
            logger.error(`原生依赖不存在${name}但${this.bundleName}存在`);
            checkError = true;
          }
        } else if (
          !this.areVersionsCompatible(
            name,
            nativeDep.version,
            bundleDep.version
          )
        ) {
          logger.error(
            `原生依赖 ${name} 版本校验失败：${this.bundleName} 中的版本：${bundleDep.version}；原生仓库中的版本：${nativeDep.version}`
          );
          checkError = true;
        }

        if (!harmony) {
          const mappedHarmonyPackageName = map[name]?.name;
          const mappedHarmonyPackageVersion = map[name]?.version;
          if (mappedHarmonyPackageName) {
            const harmonyNativeVersion =
              this.nativeDeps[mappedHarmonyPackageName].version;
            const harmonyBundleVersion = mappedHarmonyPackageVersion;
            if (harmonyBundleVersion) {
              assert(
                harmonyNativeVersion,
                `${mappedHarmonyPackageName} 原生仓库中版本不存在`
              );
              assert(
                harmonyBundleVersion,
                `${mappedHarmonyPackageName} bundle仓库中版本不存在`
              );
              if (
                !this.areVersionsCompatible(
                  mappedHarmonyPackageName,
                  harmonyNativeVersion,
                  harmonyBundleVersion
                )
              ) {
                logger.error(
                  `鸿蒙依赖 ${mappedHarmonyPackageName} 版本校验失败：${this.bundleName} 中的版本：${harmonyBundleVersion}；原生仓库中的版本：${harmonyNativeVersion}`
                );
                checkError = true;
              }
            } else {
              if (!this.allowNewPackage) {
                logger.error(`原生依赖不存在${name}但${this.bundleName}存在`);
                checkError = true;
              }
            }
          } else {
            // logger.warn(`原生依赖 ${name} 不存在鸿蒙实现且未重定向`);
            // checkError = ;
          }
        } else {
          // 内部已鸿蒙实现，跳过
        }
      }
    }
    return checkError;
  }

  private async checkDeps() {
    const { duplicateDeps } = getAllNativeDeps(
      this.bundlePath,
      [this.platform]
    );
    if (duplicateDeps.length > 0) {
      logger.error(`${this.bundleName}检测到重复依赖：${duplicateDeps.join(",")}`);
      return true;
    }
    const bundleNativeDeps = filterNativeDeps(
      await loadReactNativeConfigDeps(this.bundlePath),
      this.platform
    );
    let checkError = false;
    for (const key in bundleNativeDeps) {
      if (
        !Object.prototype.hasOwnProperty.call(this.reactNativeConfigDeps, key)
      ) {
        if (!this.allowNewPackage) {
          logger.error(`原生依赖不存在${key}但${this.bundleName}存在`);
          checkError = true;
        }
      } else if (
        bundleNativeDeps[key] &&
        !this.areVersionsCompatible(
          key,
          this.reactNativeConfigDeps[key].version,
          bundleNativeDeps[key].version
        )
      ) {
        logger.error(
          `原生依赖 ${key} 版本校验失败：${this.bundleName} 中的版本：${bundleNativeDeps[key].version}；原生仓库中的版本：${this.reactNativeConfigDeps[key].version}`
        );
        checkError = true;
      } else {
        // logger.info(`原生依赖 ${key} 版本校验成功：${this.bundleName} 中的版本：${bundleNativeDeps[key].version}；原生仓库中的版本：${this.reactNativeConfigDeps[key].version}`);
      }
    }
    return checkError;
  }

  public async run() {
    // 复制 files/react-native-config.js 到 bundlePath/react-native-config.js，存在则覆盖
    const reactNativeConfigPath = path.join(
      this.bundlePath,
      "react-native.config.js"
    );
    fs.copyFileSync(
      path.join(__dirname, "..", "..", "..", "files", "react-native.config.js"),
      reactNativeConfigPath
    );

    logger.info(`***开始校验${this.bundleName}原生依赖是否一致***`);
    if (Platform.Harmony === this.platform) {
      const checkError = await this.checkHarmonyDeps();
      logger.info(`***${this.bundleName}原生依赖校验结果: ${checkError ? "失败" : "成功"}***`);
      logger.info("\n\n")
      return checkError;
    } else {
      const checkError = await this.checkDeps();
      logger.info(`***${this.bundleName}原生依赖校验结果: ${checkError ? "失败" : "成功"}***`);
      logger.info("\n\n")
      return checkError;
    }
  }
}

export async function checkBundleDependencies(params: CheckDepParams) {
  const checker = new BundleDependencies(params);
  return checker.run();
}
