"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getXrnRepositoryRootDir = getXrnRepositoryRootDir;
exports.getXrnToolsDir = getXrnToolsDir;
exports.getBinDir = getBinDir;
exports.getPackagesDir = getPackagesDir;
exports.getTemplatesDir = getTemplatesDir;
exports.getReactNativeSubmoduleDir = getReactNativeSubmoduleDir;
exports.getAppsDir = getAppsDir;
exports.getToolsTemplatesDir = getToolsTemplatesDir;
const path_1 = __importDefault(require("path"));
const process_1 = __importDefault(require("process"));
function getXrnRepositoryRootDir() {
    // XRN_ROOT_DIR is set locally by direnv
    return process_1.default.env.XRN_ROOT_DIR || path_1.default.join(__dirname, "..", "..", "..");
}
function getXrnToolsDir() {
    return path_1.default.join(getPackagesDir(), "xrn-tools");
}
function getBinDir() {
    return path_1.default.join(getXrnToolsDir(), "bin");
}
function getPackagesDir() {
    return path_1.default.join(getXrnRepositoryRootDir(), "packages");
}
function getTemplatesDir() {
    return path_1.default.join(getXrnRepositoryRootDir(), "templates");
}
function getReactNativeSubmoduleDir() {
    return path_1.default.join(getXrnRepositoryRootDir(), "react-native-lab", "react-native");
}
function getAppsDir() {
    return path_1.default.join(getXrnRepositoryRootDir(), "apps");
}
function getToolsTemplatesDir() {
    return path_1.default.join(getPackagesDir(), "xrn-tools/templates");
}
//# sourceMappingURL=Directories.js.map