import { Package } from "./utils/PackageUtils";
import { ScreenList } from "./utils/Screen";

export async function syncScreensToPackages() {
  try {
    // 读取所有屏幕配置
    const screens = ScreenList.loadFromJson();

    // 遍历每个 screen 配置
    for (const screen of screens) {
      if (!screen.xrnMeta.packageName) {
        console.warn(
          `screen ${screen.xrnMeta.showName} 没有 packageName，跳过`
        );
        continue;
      }

      const pkg = Package.fromPackageName(screen.xrnMeta.packageName);

      if (!pkg) {
        console.warn(`包 ${screen.xrnMeta.packageName} 不存在，跳过`);
        continue;
      }

      // 更新并保存 package.json
      pkg.updateFromScreen(screen.xrnMeta);
      pkg.writePackageJson();

      console.log(`已更新 ${screen.xrnMeta.packageName} 的配置`);
    }

    console.log("所有包配置同步完成");
  } catch (error) {
    console.error("同步包配置时出错:", error);
    process.exit(1);
  }
}
