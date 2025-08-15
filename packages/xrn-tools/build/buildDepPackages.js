"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildDepPackages = buildDepPackages;
const child_process_1 = require("child_process");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const Constants_1 = require("./Constants");
const SKIP_PACKAGES = [];
function getPackageJson(packagePath) {
    const packageJsonPath = path_1.default.join(packagePath, "package.json");
    if (!fs_1.default.existsSync(packageJsonPath)) {
        throw new Error(`package.json not found in ${packagePath}`);
    }
    return JSON.parse(fs_1.default.readFileSync(packageJsonPath, "utf8"));
}
function getWorkspacePackageJsons() {
    const packageJsonMap = {};
    const packages = fs_1.default.readdirSync(Constants_1.PACKAGES_DIR);
    const apps = fs_1.default.readdirSync(Constants_1.APPS_DIR);
    for (const pkg of packages) {
        const packagePath = path_1.default.join(Constants_1.PACKAGES_DIR, pkg);
        if (fs_1.default.statSync(packagePath).isDirectory()) {
            try {
                const packageJson = getPackageJson(packagePath);
                packageJsonMap[packageJson.name] = packageJson;
            }
            catch (error) {
                console.log(error?.message);
            }
        }
    }
    for (const app of apps) {
        const appPath = path_1.default.join(Constants_1.APPS_DIR, app);
        if (fs_1.default.statSync(appPath).isDirectory()) {
            try {
                const packageJson = getPackageJson(appPath);
                packageJsonMap[packageJson.name] = packageJson;
            }
            catch (error) {
                console.log(error?.message);
            }
        }
    }
    return packageJsonMap;
}
function resolveWorkspaceDependencies(packageName, packageJsonMap) {
    const visited = new Set();
    const tempVisited = new Set();
    const sortedPackages = [];
    function visit(pkg) {
        if (tempVisited.has(pkg)) {
            throw new Error(`Circular dependency detected at ${pkg}`);
        }
        if (!visited.has(pkg)) {
            tempVisited.add(pkg);
            const packageJson = packageJsonMap[pkg];
            if (packageJson) {
                const dependencies = {
                    ...packageJson.dependencies,
                    ...packageJson.devDependencies,
                };
                for (const dep in dependencies) {
                    if (packageJsonMap[dep]) {
                        visit(dep);
                    }
                }
            }
            tempVisited.delete(pkg);
            visited.add(pkg);
            sortedPackages.push(pkg);
        }
    }
    visit(packageName);
    return sortedPackages;
}
function buildPackage(packageName, packageJsonMap) {
    const sortedPackages = resolveWorkspaceDependencies(packageName, packageJsonMap);
    console.log("Build order:", sortedPackages);
    for (const pkg of sortedPackages) {
        const packagePath = path_1.default.join(Constants_1.PACKAGES_DIR, pkg);
        if (SKIP_PACKAGES.includes(pkg) || pkg === packageName) {
            console.log(`Skipping package: ${pkg}`);
            continue;
        }
        console.log(`Building package: ${pkg}`);
        try {
            (0, child_process_1.execSync)("yarn build", { cwd: packagePath, stdio: "inherit" });
        }
        catch (err) {
            console.error(`Failed to build package: ${pkg}`);
            //   process.exit(1);
        }
    }
}
function buildDepPackages(targetPackage) {
    const packageJsonMap = getWorkspacePackageJsons();
    if (!packageJsonMap[targetPackage]) {
        console.error(`Package ${targetPackage} not found in workspace`);
        process.exit(1);
    }
    buildPackage(targetPackage, packageJsonMap);
}
//# sourceMappingURL=buildDepPackages.js.map