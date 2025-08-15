"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chooseApiType = exports.createNewNavigation = exports.readDocConstantsFile = exports.choosePackage = exports.getPackageJsonByName = exports.findWorkspacePackage = exports.getWorkspacePackages = exports.generateDocsStaticResources = exports.execAsync = void 0;
exports.sendDingTalkNotification = sendDingTalkNotification;
/* eslint-disable import/order */
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const inquirer_1 = __importDefault(require("inquirer"));
const fs_1 = __importDefault(require("fs"));
const Constants_1 = require("../Constants");
const execShPromise = require("exec-sh").promise;
const execAsync = (command, opts = { stdio: null }) => {
    console.log("执行命令:", command);
    return execShPromise(command, {
        ...opts,
    });
};
exports.execAsync = execAsync;
const generateDocsStaticResources = () => {
    const DOCS_DIR = path_1.default.join(Constants_1.XRN_DIR, "docs");
    (0, child_process_1.execSync)(`yarn generate-static-resources`, { cwd: DOCS_DIR });
};
exports.generateDocsStaticResources = generateDocsStaticResources;
const getWorkspacePackages = async () => {
    const res = await (0, exports.execAsync)(`yarn workspaces list --json`);
    const { stdout } = res;
    const packages = stdout
        .split("\n")
        .filter(Boolean)
        .map((it) => {
        try {
            return JSON.parse(it);
        }
        catch (error) {
            console.error(error);
            return null;
        }
    })
        .filter(Boolean);
    return packages;
};
exports.getWorkspacePackages = getWorkspacePackages;
const findWorkspacePackage = async (packageName) => {
    const packages = await (0, exports.getWorkspacePackages)();
    return packages.find((it) => it.name === packageName);
};
exports.findWorkspacePackage = findWorkspacePackage;
const getPackageJsonByName = async (packageName) => {
    const packageInfo = await (0, exports.findWorkspacePackage)(packageName);
    if (!packageInfo) {
        return null;
    }
    const packageJsonPath = path_1.default.join(Constants_1.XRN_DIR, packageInfo.location, "package.json");
    const currentPackageJson = JSON.parse(fs_1.default.readFileSync(packageJsonPath, "utf-8"));
    return currentPackageJson;
};
exports.getPackageJsonByName = getPackageJsonByName;
// 让用户选择一个二方包
const choosePackage = async () => {
    // 获取工作区中所有的包
    const packages = (await (0, exports.getWorkspacePackages)()).filter((pkg) => pkg.name.startsWith("xt-rn") || pkg.name.startsWith("xrn-"));
    // 通过 inquirer 提示用户选择一个包
    const { selectedPackage } = await inquirer_1.default.prompt([
        {
            type: "list",
            name: "selectedPackage",
            message: "请选择一个二方包：",
            choices: packages.map((pkg) => ({
                name: `${pkg.name} (${pkg.location})`,
                value: pkg,
            })),
        },
    ]);
    return selectedPackage;
};
exports.choosePackage = choosePackage;
const readDocConstantsFile = (filename) => {
    return JSON.parse(fs_1.default.readFileSync(path_1.default.join(Constants_1.XRN_DIR, "docs", "constants", filename), "utf-8"));
};
exports.readDocConstantsFile = readDocConstantsFile;
const createNewNavigation = async () => {
    const { name } = await inquirer_1.default.prompt([
        {
            type: "input",
            name: "name",
            message: "请输入新导航的名称:",
            validate: (input) => {
                if (!input.trim()) {
                    return "名称不能为空";
                }
                return true;
            },
        },
    ]);
    const { directory } = await inquirer_1.default.prompt([
        {
            type: "input",
            name: "directory",
            message: "请输入新导航的目录名:",
            validate: (input) => {
                if (!input.trim()) {
                    return "目录名不能为空";
                }
                if (!/^[a-zA-Z0-9-_]+$/.test(input)) {
                    return "目录名只能包含字母、数字、下划线和横线";
                }
                return true;
            },
        },
    ]);
    const newNavigation = { name, directory };
    const configPath = path_1.default.join(Constants_1.XRN_DIR, "docs", "constants", "navigation-config.json");
    const config = (0, exports.readDocConstantsFile)("navigation-config.json");
    config.sdk = [...config.sdk, newNavigation];
    fs_1.default.writeFileSync(configPath, JSON.stringify(config, null, 2));
    return newNavigation;
};
exports.createNewNavigation = createNewNavigation;
const chooseApiType = async () => {
    const navigationConfig = (0, exports.readDocConstantsFile)("navigation-config.json");
    let choices = navigationConfig.sdk.map((it) => ({
        name: it.name,
        value: it.directory,
    }));
    // 添加创建新导航选项
    choices = [...choices, { name: "+ 创建新导航", value: "CREATE_NEW" }];
    const { selectedDir } = await inquirer_1.default.prompt([
        {
            type: "list",
            name: "selectedDir",
            message: "请选择API类型:",
            choices,
        },
    ]);
    if (selectedDir === "CREATE_NEW") {
        const newNavigation = await (0, exports.createNewNavigation)();
        return newNavigation.directory;
    }
    return selectedDir;
};
exports.chooseApiType = chooseApiType;
async function sendDingTalkNotification(message) {
    console.log("sendDingTalkNotification", message);
}
//# sourceMappingURL=index.js.map