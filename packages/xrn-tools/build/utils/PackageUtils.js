"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Package = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const _1 = require(".");
const Constants_1 = require("../Constants");
class Package {
    name;
    version;
    packageJsonPath;
    packageJson;
    constructor(name) {
        this.name = name;
        const packageJsonPath = path_1.default.join(Constants_1.PACKAGES_DIR, this.name, "package.json");
        this.packageJsonPath = packageJsonPath;
        const packageJson = this.getPackageJson();
        this.version = packageJson.version;
        this.packageJson = packageJson;
    }
    getPackageJson() {
        return fs_extra_1.default.readJsonSync(this.packageJsonPath);
    }
    writePackageJson() {
        fs_extra_1.default.writeJson(this.packageJsonPath, this.packageJson, {
            spaces: 2,
        });
    }
    getXrnMeta() {
        return this.packageJson.xrnMeta;
    }
    updateFromScreen(screen) {
        this.packageJson.description = screen.description;
        this.packageJson.homepage = screen.sdkPath
            ? `https://xtransferorg.github.io/xrn/versions/latest/sdk/${screen.sdkPath}`
            : undefined;
        this.packageJson.xrnMeta = screen;
    }
    async installPackage(packageName) {
        await (0, _1.execAsync)(`yarn workspace ${this.name} add ${packageName}`);
    }
    async installTo(targetPackageName) {
        await (0, _1.execAsync)(`yarn workspace ${targetPackageName} add ${this.name}@${this.version}`);
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
    static fromPackageName(packageName) {
        const packagePath = path_1.default.join(Constants_1.PACKAGES_DIR, packageName, "package.json");
        if (!fs_extra_1.default.existsSync(packagePath)) {
            return null;
        }
        return new Package(packageName);
    }
    static getPackages() {
        const packages = fs_extra_1.default.readdirSync(Constants_1.PACKAGES_DIR);
        return packages
            .filter((packageName) => {
            const packagePath = path_1.default.join(Constants_1.PACKAGES_DIR, packageName, "package.json");
            return fs_extra_1.default.existsSync(packagePath);
        })
            .map((packageName) => new Package(packageName))
            .filter((it) => !it.packageJson.private);
    }
    static getPackagesWithXrnMeta() {
        return this.getPackages().filter((it) => it.getXrnMeta());
    }
    static getXrnMetaList() {
        return this.getPackagesWithXrnMeta().map((it) => it.getXrnMeta());
    }
}
exports.Package = Package;
//# sourceMappingURL=PackageUtils.js.map