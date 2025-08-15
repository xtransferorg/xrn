"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addDemoScreenToXrnGo = void 0;
const PackageUtils_1 = require("./utils/PackageUtils");
const Screen_1 = require("./utils/Screen");
const addDemoScreenToXrnGo = async ({ packageName, }) => {
    try {
        // 获取当前包路径和版本号
        // const packageJson = await getPackageJsonByName(packageName);
        const pkg = PackageUtils_1.Package.fromPackageName(packageName);
        if (!pkg) {
            console.error(`Package ${packageName} not found`);
            return;
        }
        if (pkg.getXrnMeta()?.exportFromCore) {
            await pkg.installToXtRnCore();
        }
        else {
            await pkg.installToXrnGo();
            await pkg.installToXrnGoMain();
        }
        const xrnMeta = pkg.getXrnMeta();
        if (!xrnMeta) {
            console.error(`Package ${packageName} 没有 xrnMeta`);
            return;
        }
        const screen = new Screen_1.Screen(xrnMeta);
        const screens = Screen_1.ScreenList.create();
        // 在screen配置文件中添加指定包，包括处理包名格式等功能
        await screens.addPackageToScreenJson(pkg);
        // 在screens目录下生成基本的Demo文件和内容，方便快速开发
        // await screens.generateScreenFiles();
        await screen.writeScreenFile();
        // 生成 Demo screen 的导入和路由相关配置
        await screens.generateNavigationScreens();
    }
    catch (error) {
        console.error(`Failed to add`);
        console.error(error?.message);
    }
};
exports.addDemoScreenToXrnGo = addDemoScreenToXrnGo;
//# sourceMappingURL=addDemoScreenToXrnGo.js.map