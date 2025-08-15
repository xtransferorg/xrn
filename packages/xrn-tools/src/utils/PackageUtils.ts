import fs from "fs-extra";
import path from "path";

import { execAsync } from ".";
import { PACKAGES_DIR } from "../Constants";
import { PackageJson, XrnMeta } from "./types";

export class Package {
  name: string;
  version: string;
  packageJsonPath: string;
  packageJson: PackageJson;

  constructor(name: string) {
    this.name = name;
    const packageJsonPath = path.join(PACKAGES_DIR, this.name, "package.json");
    this.packageJsonPath = packageJsonPath;
    const packageJson = this.getPackageJson();
    this.version = packageJson.version;
    this.packageJson = packageJson;
  }

  getPackageJson(): PackageJson {
    return fs.readJsonSync(this.packageJsonPath);
  }

  writePackageJson() {
    fs.writeJson(this.packageJsonPath, this.packageJson, {
      spaces: 2,
    });
  }

  getXrnMeta() {
    return this.packageJson.xrnMeta;
  }

  updateFromScreen(screen: XrnMeta) {
    this.packageJson.description = screen.description;
    this.packageJson.homepage = screen.sdkPath
      ? `https://xtransferorg.github.io/xrn/versions/latest/sdk/${screen.sdkPath}`
      : undefined;
    this.packageJson.xrnMeta = screen;
  }

  async installPackage(packageName: string) {
    await execAsync(`yarn workspace ${this.name} add ${packageName}`);
  }

  async installTo(targetPackageName: string) {
    await execAsync(
      `yarn workspace ${targetPackageName} add ${this.name}@${this.version}`
    );
  }

  async installToXrnGo() {
    await this.installTo("xrngo");
  }

  async installToXrnGoMain() {
    await this.installTo("xrngo-main");
  }

  async installToXtRnCore() {
    await this.installTo("xt-rn-core");
  }

  static fromPackageName(packageName: string): Package | null {
    const packagePath = path.join(PACKAGES_DIR, packageName, "package.json");
    if (!fs.existsSync(packagePath)) {
      return null;
    }
    return new Package(packageName);
  }

  static getPackages(): Package[] {
    const packages = fs.readdirSync(PACKAGES_DIR);
    return packages
      .filter((packageName) => {
        const packagePath = path.join(
          PACKAGES_DIR,
          packageName,
          "package.json"
        );
        return fs.existsSync(packagePath);
      })
      .map((packageName) => new Package(packageName))
      .filter((it) => !it.packageJson.private);
  }

  static getPackagesWithXrnMeta(): Package[] {
    return this.getPackages().filter((it) => it.getXrnMeta());
  }

  static getXrnMetaList(): XrnMeta[] {
    return this.getPackagesWithXrnMeta().map((it) =>
      it.getXrnMeta()
    ) as XrnMeta[];
  }
}
