"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addLibToOhEntryDep = exports.addModuleToOhEntryDep = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const json5_1 = __importDefault(require("json5"));
const path_1 = __importDefault(require("path"));
const Constants_1 = require("./Constants");
const utils_1 = require("./utils");
const addModuleToOhEntryDep = async ({ packageName, harmonyModuleName, sourceCode, }) => {
    const xrngoPath = path_1.default.join(Constants_1.XRN_DIR, "apps/xrngo");
    const harmonyBuildProfilePath = path_1.default.join(xrngoPath, "harmony", "build-profile.json5");
    const buildProfileContent = fs_extra_1.default.readFileSync(harmonyBuildProfilePath, "utf-8");
    const buildProfile = json5_1.default.parse(buildProfileContent);
    buildProfile.modules.push({
        name: harmonyModuleName,
        srcPath: `../../../packages/${packageName}/harmony/${harmonyModuleName}`,
    });
    fs_extra_1.default.writeFileSync(harmonyBuildProfilePath, json5_1.default.stringify(buildProfile, null, 2));
    console.log(`Harmony lib ${harmonyModuleName} added to xrngo entry dependencies`);
};
exports.addModuleToOhEntryDep = addModuleToOhEntryDep;
const addLibToOhEntryDep = async ({ packageName, harmonyModuleName, sourceCode, }) => {
    const packageInfo = await (0, utils_1.findWorkspacePackage)(packageName);
    if (!packageInfo) {
        console.error(`Package ${packageName} not found in workspace`);
        return;
    }
    const xrngoPath = path_1.default.join(Constants_1.XRN_DIR, "apps/xrngo");
    const entryOhPackagePath = path_1.default.join(xrngoPath, "harmony", "entry", "oh-package.json5");
    const json5Content = fs_extra_1.default.readFileSync(entryOhPackagePath, "utf-8");
    const ohPackage = json5_1.default.parse(json5Content);
    if (sourceCode) {
        // 源码调试
        ohPackage.dependencies[packageName] =
            `../../../../packages/${packageName}/harmony/${harmonyModuleName}`;
    }
    else {
        ohPackage.dependencies[packageName] =
            `../../node_modules/${packageName}/harmony/${harmonyModuleName}.har`;
    }
    fs_extra_1.default.writeFileSync(entryOhPackagePath, json5_1.default.stringify(ohPackage, null, 2));
    (0, exports.addModuleToOhEntryDep)({ packageName, harmonyModuleName, sourceCode });
};
exports.addLibToOhEntryDep = addLibToOhEntryDep;
//# sourceMappingURL=addLibToOhEntryDep.js.map