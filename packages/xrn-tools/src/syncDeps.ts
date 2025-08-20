import * as fs from "fs";
import * as path from "path";

import { XRN_DIR } from "./Constants";
import { findWorkspacePackage, getWorkspacePackages } from "./utils";

const SKIP_PACKAGES: string[] = [];

// 读取 JSON 文件辅助函数
const readJSON = (filePath: string): any => {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
};

// 写入 JSON 文件辅助函数
const writeJSON = (filePath: string, data: any) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
};

// 需要更新的依赖字段
const dependencyFields: (
  | "dependencies"
  | "devDependencies"
  | "peerDependencies"
)[] = ["dependencies", "devDependencies"];

/**
 * 公共方法：更新 package.json 中的依赖版本
 *
 * @param pkgData 包的 package.json 对象
 * @param getTargetVersion 根据依赖名称返回目标版本（如果有的话）
 * @param pkgName 包名（用于日志打印）
 * @returns 是否有修改
 */
const updateDependenciesWithTargetVersion = (
  pkgData: any,
  getTargetVersion: (depName: string) => string | undefined,
  pkgName: string
): boolean => {
  let modified = false;
  dependencyFields.forEach((field) => {
    if (pkgData[field]) {
      Object.keys(pkgData[field]).forEach((dep) => {
        const targetVersion = getTargetVersion(dep);
        if (targetVersion && pkgData[field][dep] !== targetVersion) {
          console.log(
            `更新 ${pkgName} 中的 ${dep} 依赖版本: ${pkgData[field][dep]} -> ${targetVersion}`
          );
          pkgData[field][dep] = targetVersion;
          modified = true;
        }
      });
    }
  });
  return modified;
};

/**
 * 同步工作区中所有包对某个依赖的版本
 *
 * @param targetDepName 目标依赖的名称
 */
export const syncDependencyVersionAcrossWorkspaces = async (
  targetDepName: string
) => {
  const _packages = await getWorkspacePackages();
  const packages = _packages.filter((pkg) => !SKIP_PACKAGES.includes(pkg.name));

  const targetDepPackageInfo = await findWorkspacePackage(targetDepName);
  if (!targetDepPackageInfo) {
    console.error(`未找到依赖包 ${targetDepName}`);
    return;
  }

  // 获取目标依赖包的版本（取自 node_modules 中的安装版本）
  const targetDepPackageJsonPath = path.join(
    XRN_DIR,
    targetDepPackageInfo.location,
    "package.json"
  );
  if (!fs.existsSync(targetDepPackageJsonPath)) {
    console.error(`未找到依赖包 ${targetDepName} 的 package.json 文件`);
    return;
  }
  const targetDepPackage = readJSON(targetDepPackageJsonPath);
  const targetDepVersion = targetDepPackage.version;

  // 定义获取目标依赖版本的函数
  const getTargetVersion = (depName: string) => {
    if (depName === targetDepName) {
      return targetDepVersion;
    }
    return undefined;
  };

  // 遍历所有工作区包，同步该依赖的版本
  packages.forEach((pkg) => {
    const packageJsonPath = path.join(XRN_DIR, pkg.location, "package.json");
    if (!fs.existsSync(packageJsonPath)) return;
    const pkgData = readJSON(packageJsonPath);

    const modified = updateDependenciesWithTargetVersion(
      pkgData,
      getTargetVersion,
      pkg.name
    );
    if (modified) {
      writeJSON(packageJsonPath, pkgData);
    }
  });

  console.log(
    `所有工作区中对 ${targetDepName} 的依赖已更新为版本 ${targetDepVersion}`
  );

  // 新增：同步 apps/*/package.json 里的 targetDepName 依赖
  const appsDir = path.join(XRN_DIR, "apps");
  const appDirs = fs.readdirSync(appsDir).filter((d) => {
    const stat = fs.statSync(path.join(appsDir, d));
    return stat.isDirectory();
  });
  appDirs.forEach((appName) => {
    const appPkgJson = path.join(appsDir, appName, "package.json");
    if (!fs.existsSync(appPkgJson)) return;
    const pkgData = readJSON(appPkgJson);
    const modified = updateDependenciesWithTargetVersion(
      pkgData,
      (depName) => (depName === targetDepName ? targetDepVersion : undefined),
      pkgData.name
    );
    if (modified) {
      writeJSON(appPkgJson, pkgData);
      console.log(`已同步 apps/${appName}/package.json 的 ${targetDepName} 依赖版本`);
    }
  });
};

/**
 * 同步工作区中所有包的依赖版本
 * 如果依赖项在工作区中存在，则更新为工作区中的版本
 */
export const syncAllDependenciesAcrossWorkspaces = async () => {
  const _packages = await getWorkspacePackages();
  const packages = _packages.filter((pkg) => !SKIP_PACKAGES.includes(pkg.name));

  // 构建一个映射：工作区包名称 -> 工作区包版本
  const workspaceVersions: Record<string, string> = {};
  packages.forEach((pkg) => {
    const packageJsonPath = path.join(XRN_DIR, pkg.location, "package.json");
    if (fs.existsSync(packageJsonPath)) {
      const pkgData = readJSON(packageJsonPath);
      workspaceVersions[pkg.name] = pkgData.version;
    }
  });

  // 定义获取依赖目标版本的函数（如果依赖是工作区中的包，则返回对应版本）
  const getTargetVersion = (depName: string) => {
    return workspaceVersions[depName];
  };

  // 遍历所有工作区包，更新依赖项版本
  packages.forEach((pkg) => {
    const packageJsonPath = path.join(XRN_DIR, pkg.location, "package.json");
    if (!fs.existsSync(packageJsonPath)) return;
    const pkgData = readJSON(packageJsonPath);

    const modified = updateDependenciesWithTargetVersion(
      pkgData,
      getTargetVersion,
      pkg.name
    );
    if (modified) {
      writeJSON(packageJsonPath, pkgData);
    }
  });

  console.log("所有工作区中的依赖版本已同步完成");

  // 新增：同步 apps/*/package.json 里的依赖
  const appsDir = path.join(XRN_DIR, "apps");
  const appDirs = fs.readdirSync(appsDir).filter((d) => {
    const stat = fs.statSync(path.join(appsDir, d));
    return stat.isDirectory();
  });
  appDirs.forEach((appName) => {
    const appPkgJson = path.join(appsDir, appName, "package.json");
    if (!fs.existsSync(appPkgJson)) return;
    const pkgData = readJSON(appPkgJson);
    const modified = updateDependenciesWithTargetVersion(
      pkgData,
      (depName) => workspaceVersions[depName],
      pkgData.name
    );
    if (modified) {
      writeJSON(appPkgJson, pkgData);
      console.log(`已同步 apps/${appName}/package.json 的依赖版本`);
    }
  });
};
