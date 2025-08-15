"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createHarmonyLib = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const json5_1 = __importDefault(require("json5"));
const path_1 = __importDefault(require("path"));
const Constants_1 = require("./Constants");
const utils_1 = require("./utils");
const createHarmonyLib = async ({ packageName, harmonyModuleName, }) => {
    const packageInfo = await (0, utils_1.findWorkspacePackage)(packageName);
    if (!packageInfo) {
        console.error(`Package ${packageName} not found in workspace`);
        return;
    }
    const xrngoPath = path_1.default.join(Constants_1.XRN_DIR, "apps/xrngo");
    const packagePath = path_1.default.join(Constants_1.XRN_DIR, packageInfo.location);
    const packageHarmonyLibPath = path_1.default.join(packagePath, "harmony", harmonyModuleName);
    const xrngoHarmonyLibPath = path_1.default.join(xrngoPath, "harmony", harmonyModuleName);
    const harmonyBuildProfilePath = path_1.default.join(xrngoPath, "harmony", "build-profile.json5");
    if (fs_extra_1.default.existsSync(xrngoHarmonyLibPath)) {
        throw new Error("Harmony lib already exists");
    }
    if (!fs_extra_1.default.existsSync(packageHarmonyLibPath)) {
        throw new Error("Harmony lib not found in package");
    }
    fs_extra_1.default.copySync(packageHarmonyLibPath, xrngoHarmonyLibPath);
    const buildProfileContent = fs_extra_1.default.readFileSync(harmonyBuildProfilePath, "utf-8");
    const buildProfile = json5_1.default.parse(buildProfileContent);
    buildProfile.modules.push({
        name: harmonyModuleName,
        srcPath: `./${harmonyModuleName}`,
    });
    fs_extra_1.default.writeFileSync(harmonyBuildProfilePath, json5_1.default.stringify(buildProfile, null, 2));
    console.log(`Harmony lib ${harmonyModuleName} created in xrngo`);
};
exports.createHarmonyLib = createHarmonyLib;
//# sourceMappingURL=createHarmonyLib.js.map