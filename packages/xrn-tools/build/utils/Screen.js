"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScreenList = exports.Screen = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const ejs_1 = __importDefault(require("ejs"));
const Constants_1 = require("../Constants");
class Screen {
    xrnMeta;
    constructor(xrnMeta) {
        this.xrnMeta = xrnMeta;
    }
    getScreenPath() {
        return path_1.default.join(Constants_1.APPS_DIR, "xrngo-main/src/screens", `${this.xrnMeta.name}Screen.tsx`);
    }
    getScreenFileContent() {
        const screenPath = this.getScreenPath();
        if (!fs_extra_1.default.existsSync(screenPath)) {
            console.warn(`文件不存在：${screenPath}`);
            return "";
        }
        return fs_extra_1.default.readFileSync(screenPath, "utf-8");
    }
    async genScreenFileContent() {
        const templatePath = path_1.default.join(Constants_1.TOOLS_TEMPLATES_DIR, "screen.ejs");
        const template = await fs_extra_1.default.readFile(templatePath, "utf-8");
        return ejs_1.default.render(template, {
            name: this.xrnMeta.name,
            title: this.xrnMeta.title,
        });
    }
    async writeScreenFile() {
        const screenPath = this.getScreenPath();
        const screenFileContent = await this.genScreenFileContent();
        await fs_extra_1.default.writeFile(screenPath, screenFileContent);
    }
}
exports.Screen = Screen;
class ScreenList {
    screens;
    constructor(screens) {
        this.screens = screens;
    }
    static create() {
        const screensPath = path_1.default.join(Constants_1.APPS_DIR, "xrngo-main/screens.json");
        const screensData = fs_extra_1.default.readJsonSync(screensPath, "utf-8");
        return new ScreenList(screensData.map((screenData) => new Screen(screenData)));
    }
    getScreensDirPath() {
        return path_1.default.join(Constants_1.APPS_DIR, "xrngo-main/src/screens");
    }
    getScreensJsonPath() {
        return path_1.default.join(Constants_1.APPS_DIR, "xrngo-main/screens.json");
    }
    getNavigationScreensPath() {
        return path_1.default.join(Constants_1.APPS_DIR, "xrngo-main/src/navigation/Screens.tsx");
    }
    static loadFromJson() {
        const screensPath = path_1.default.join(Constants_1.APPS_DIR, "xrngo-main/screens.json");
        const screensData = fs_extra_1.default.readJsonSync(screensPath, "utf-8");
        return screensData.map((screenData) => new Screen(screenData));
    }
    async addPackageToScreenJson(pkg) {
        if (this.screens.some((item) => item.xrnMeta.name === pkg.name)) {
            console.log(`配置中已存在项：${pkg.name}`);
            return;
        }
        const newItem = pkg.getXrnMeta();
        if (!newItem) {
            console.error(`Package ${pkg.name} 没有 xrnMeta`);
            return;
        }
        this.screens.push(new Screen(newItem));
        await fs_extra_1.default.writeJson(this.getScreensJsonPath(), this.screens.map((item) => item.xrnMeta), {
            spaces: 2,
        });
        console.log(`成功添加项：${JSON.stringify(newItem, null, 2)}`);
    }
    async generateNavigationScreens() {
        const templatePath = path_1.default.join(Constants_1.TOOLS_TEMPLATES_DIR, "navigation.ejs");
        const template = await fs_extra_1.default.readFile(templatePath, "utf-8");
        const tsContent = ejs_1.default.render(template, { screens: this.screens });
        await fs_extra_1.default.writeFile(this.getNavigationScreensPath(), tsContent, "utf-8");
        console.log("成功生成导航配置文件");
    }
    async generateScreenFiles() {
        const screensDir = this.getScreensDirPath();
        fs_extra_1.default.ensureDirSync(screensDir);
        for (const screen of this.screens) {
            const screenPath = screen.getScreenPath();
            if (fs_extra_1.default.existsSync(screenPath)) {
                console.log(`文件已存在：${screenPath}`);
                continue;
            }
            await screen.writeScreenFile();
            console.log(`成功生成文件：${screenPath}`);
        }
    }
}
exports.ScreenList = ScreenList;
//# sourceMappingURL=Screen.js.map