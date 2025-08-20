"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.copyOhLibToPackage = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const Constants_1 = require("./Constants");
const utils_1 = require("./utils");
const copyOhLibToPackage = async ({ packageName, harmonyModuleName, }) => {
    const packageInfo = await (0, utils_1.findWorkspacePackage)(packageName);
    if (!packageInfo) {
        console.error(`Package ${packageName} not found in workspace`);
        return;
    }
    const xrngoPath = path_1.default.join(Constants_1.XRN_DIR, "apps/xrngo");
    const packagePath = path_1.default.join(Constants_1.XRN_DIR, packageInfo.location);
    const packageHarmonyPath = path_1.default.join(packagePath, "harmony");
    const xrngoHarmonyLibHarPath = path_1.default.join(xrngoPath, `harmony/${harmonyModuleName}/build/default/outputs/default/${harmonyModuleName}.har`);
    if (!fs_extra_1.default.existsSync(xrngoHarmonyLibHarPath)) {
        throw new Error("Harmony lib har not exists");
    }
    if (!fs_extra_1.default.existsSync(packageHarmonyPath)) {
        throw new Error("Harmony lib not found in package");
    }
    // fs.renameSync(xrngoHarmonyLibHarPath, `${packageHarmonyPath}/${harmonyModuleName}.har`);
    fs_extra_1.default.copyFileSync(xrngoHarmonyLibHarPath, `${packageHarmonyPath}/${harmonyModuleName}.har`);
};
exports.copyOhLibToPackage = copyOhLibToPackage;
//# sourceMappingURL=copyOhLibToPackage.js.map