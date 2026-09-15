import { NativePostInstall } from "./NativePostInstall";
import { XrnConfig } from "./utils";
import path from "path";
import fs from "fs-extra";
import logger from "../utlis/logger";
import { BundleConfigItem } from "../build/typing";

/**
 * iOS 平台 PostInstall
 */
export class IOSPostInstall extends NativePostInstall {
  constructor(cwd: string, xrnConfig: XrnConfig | null) {
    super(cwd, "iOS", xrnConfig);
  }

  writeBundleConfig(bundles: BundleConfigItem[]): void {
    // 写入 xtBundles.plist 到 iOS
    this.writeBundleConfigPlist(
      path.join("ios", "BundleEventCenter", "bundleController"),
      "xtBundles.plist",
      bundles
    );
  }

  /**
   * 写入 iOS plist 格式的 bundle 配置
   */
  private writeBundleConfigPlist(relativePath: string, fileName: string, bundles: BundleConfigItem[]): void {
    logger.info(`写入 ${this.platformName} ${fileName}...`);

    const bundleConfigPath = path.join(this.cwd, relativePath, fileName);

    try {
      // 生成 plist 格式的内容
      const plistContent = this.generatePlistContent(
        bundles
      );

      // 确保目录存在
      fs.ensureDirSync(path.dirname(bundleConfigPath));

      // 写入文件
      fs.writeFileSync(bundleConfigPath, plistContent, "utf8");

      logger.info(
        `✅ ${this.platformName} ${fileName} 写入成功: ${bundleConfigPath}`
      );
    } catch (error) {
      logger.error(`❌ 写入 ${this.platformName} ${fileName} 失败:`, error);
      throw error;
    }
  }

  /**
   * 生成 plist 格式的 XML 内容
   */
  private generatePlistContent(
    bundles: Array<{ name: string; [key: string]: any }>
  ): string {
    const dictEntries = bundles
      .filter((bundle) => bundle.bundleType !== "main")
      .map((bundle) => {
        const port = bundle.port || "";
        const jsBundleName = bundle.name || "";
        const codePushKey = bundle.codePushKey || "";

        return `\t<dict>
\t\t<key>port</key>
\t\t<string>${port}</string>
\t\t<key>jsBundleName</key>
\t\t<string>${jsBundleName}</string>
\t\t<key>codePushKey</key>
\t\t<string>${codePushKey}</string>
\t</dict>`;
      })
      .join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<array>
${dictEntries}
</array>
</plist>
`;
  }
}

