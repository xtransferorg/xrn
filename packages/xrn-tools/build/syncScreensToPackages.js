"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncScreensToPackages = syncScreensToPackages;
const PackageUtils_1 = require("./utils/PackageUtils");
const Screen_1 = require("./utils/Screen");
async function syncScreensToPackages() {
    try {
        // 读取所有屏幕配置
        const screens = Screen_1.ScreenList.loadFromJson();
        // 遍历每个 screen 配置
        for (const screen of screens) {
            if (!screen.xrnMeta.packageName) {
                console.warn(`screen ${screen.xrnMeta.showName} 没有 packageName，跳过`);
                continue;
            }
            const pkg = PackageUtils_1.Package.fromPackageName(screen.xrnMeta.packageName);
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
    }
    catch (error) {
        console.error("同步包配置时出错:", error);
        process.exit(1);
    }
}
//# sourceMappingURL=syncScreensToPackages.js.map