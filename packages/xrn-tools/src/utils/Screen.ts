import fsExtra from "fs-extra";
import path from "path";
import ejs from "ejs";

import { Package } from "./PackageUtils";
import { APPS_DIR, TOOLS_TEMPLATES_DIR } from "../Constants";
import { XrnMeta } from "./types";

export class Screen {
  xrnMeta: XrnMeta;

  constructor(xrnMeta: XrnMeta) {
    this.xrnMeta = xrnMeta;
  }

  getScreenPath() {
    return path.join(
      APPS_DIR,
      "xrngo-main/src/screens",
      `${this.xrnMeta.name}Screen.tsx`
    );
  }

  getScreenFileContent() {
    const screenPath = this.getScreenPath();
    if (!fsExtra.existsSync(screenPath)) {
      console.warn(`文件不存在：${screenPath}`);
      return "";
    }
    return fsExtra.readFileSync(screenPath, "utf-8");
  }

  async genScreenFileContent() {
    const templatePath = path.join(TOOLS_TEMPLATES_DIR, "screen.ejs");
    const template = await fsExtra.readFile(templatePath, "utf-8");
    return ejs.render(template, {
      name: this.xrnMeta.name,
      title: this.xrnMeta.title,
    });
  }

  async writeScreenFile() {
    const screenPath = this.getScreenPath();
    const screenFileContent = await this.genScreenFileContent();
    await fsExtra.writeFile(screenPath, screenFileContent);
  }
}

export class ScreenList {
  screens: Screen[];

  constructor(screens: Screen[]) {
    this.screens = screens;
  }

  static create() {
    const screensPath = path.join(APPS_DIR, "xrngo-main/screens.json");
    const screensData = fsExtra.readJsonSync(screensPath, "utf-8");

    return new ScreenList(
      screensData.map((screenData: XrnMeta) => new Screen(screenData))
    );
  }

  getScreensDirPath() {
    return path.join(APPS_DIR, "xrngo-main/src/screens");
  }

  getScreensJsonPath() {
    return path.join(APPS_DIR, "xrngo-main/screens.json");
  }

  getNavigationScreensPath() {
    return path.join(APPS_DIR, "xrngo-main/src/navigation/Screens.tsx");
  }

  static loadFromJson(): Screen[] {
    const screensPath = path.join(APPS_DIR, "xrngo-main/screens.json");
    const screensData = fsExtra.readJsonSync(screensPath, "utf-8");
    return screensData.map((screenData: XrnMeta) => new Screen(screenData));
  }

  async addPackageToScreenJson(pkg: Package) {
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
    await fsExtra.writeJson(
      this.getScreensJsonPath(),
      this.screens.map((item) => item.xrnMeta),
      {
        spaces: 2,
      }
    );
    console.log(`成功添加项：${JSON.stringify(newItem, null, 2)}`);
  }

  async generateNavigationScreens() {
    const templatePath = path.join(TOOLS_TEMPLATES_DIR, "navigation.ejs");
    const template = await fsExtra.readFile(templatePath, "utf-8");
    const tsContent = ejs.render(template, { screens: this.screens });

    await fsExtra.writeFile(
      this.getNavigationScreensPath(),
      tsContent,
      "utf-8"
    );
    console.log("成功生成导航配置文件");
  }

  async generateScreenFiles() {
    const screensDir = this.getScreensDirPath();
    fsExtra.ensureDirSync(screensDir);

    for (const screen of this.screens) {
      const screenPath = screen.getScreenPath();

      if (fsExtra.existsSync(screenPath)) {
        console.log(`文件已存在：${screenPath}`);
        continue;
      }

      await screen.writeScreenFile();
      console.log(`成功生成文件：${screenPath}`);
    }
  }
}
