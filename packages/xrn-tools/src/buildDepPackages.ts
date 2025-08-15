import { execSync } from "child_process";
import fs from "fs";
import path from "path";

import { PACKAGES_DIR, APPS_DIR } from "./Constants";

interface PackageJson {
  name: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

type PackageJsonMap = Record<string, PackageJson>;

const SKIP_PACKAGES: string[] = [];

function getPackageJson(packagePath: string): PackageJson {
  const packageJsonPath = path.join(packagePath, "package.json");
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error(`package.json not found in ${packagePath}`);
  }
  return JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
}

function getWorkspacePackageJsons(): PackageJsonMap {
  const packageJsonMap: PackageJsonMap = {};
  const packages = fs.readdirSync(PACKAGES_DIR);
  const apps = fs.readdirSync(APPS_DIR);

  for (const pkg of packages) {
    const packagePath = path.join(PACKAGES_DIR, pkg);
    if (fs.statSync(packagePath).isDirectory()) {
      try {
        const packageJson = getPackageJson(packagePath);
        packageJsonMap[packageJson.name] = packageJson;
      } catch (error: any) {
        console.log(error?.message);
      }
    }
  }

  for (const app of apps) {
    const appPath = path.join(APPS_DIR, app);
    if (fs.statSync(appPath).isDirectory()) {
      try {
        const packageJson = getPackageJson(appPath);
        packageJsonMap[packageJson.name] = packageJson;
      } catch (error: any) {
        console.log(error?.message);
      }
    }
  }

  return packageJsonMap;
}

function resolveWorkspaceDependencies(
  packageName: string,
  packageJsonMap: PackageJsonMap
): string[] {
  const visited = new Set<string>();
  const tempVisited = new Set<string>();
  const sortedPackages: string[] = [];

  function visit(pkg: string) {
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

function buildPackage(packageName: string, packageJsonMap: PackageJsonMap) {
  const sortedPackages = resolveWorkspaceDependencies(
    packageName,
    packageJsonMap
  );
  console.log("Build order:", sortedPackages);

  for (const pkg of sortedPackages) {
    const packagePath = path.join(PACKAGES_DIR, pkg);
    if (SKIP_PACKAGES.includes(pkg) || pkg === packageName) {
      console.log(`Skipping package: ${pkg}`);
      continue;
    }
    console.log(`Building package: ${pkg}`);
    try {
      execSync("yarn build", { cwd: packagePath, stdio: "inherit" });
    } catch (err) {
      console.error(`Failed to build package: ${pkg}`);
      //   process.exit(1);
    }
  }
}

export function buildDepPackages(targetPackage: string) {
  const packageJsonMap = getWorkspacePackageJsons();
  if (!packageJsonMap[targetPackage]) {
    console.error(`Package ${targetPackage} not found in workspace`);
    process.exit(1);
  }

  buildPackage(targetPackage, packageJsonMap);
}
