import path from "path";

import { publishPackage } from "./publishPackage";
import { sendDingTalkNotification } from "./utils";
import { Package } from "./utils/PackageUtils";

interface BatchPublishOptions {
  beta?: boolean;
  packages: string[];
}

interface PackageInfo {
  name: string;
  path: string;
  dependencies: string[];
  devDependencies: string[];
}

async function getPackageInfo(pkgName: string): Promise<PackageInfo> {
  const rootDir = process.cwd();
  const scanPaths = ["packages", "templates", "apps"];

  for (const scanPath of scanPaths) {
    const pkgPath = path.join(rootDir, scanPath, pkgName, "package.json");
    try {
      const packageJson = require(pkgPath);
      return {
        name: packageJson.name,
        path: path.dirname(pkgPath),
        dependencies: Object.keys(packageJson.dependencies || {}),
        devDependencies: Object.keys(packageJson.devDependencies || {}),
      };
    } catch (err) {
      continue;
    }
  }

  throw new Error(`找不到包 ${pkgName}`);
}

function sortPackagesByDependencies(packages: PackageInfo[]): PackageInfo[] {
  const visited = new Set<string>();
  const sorted: PackageInfo[] = [];

  function visit(pkg: PackageInfo) {
    if (visited.has(pkg.name)) return;
    visited.add(pkg.name);

    // 获取所有依赖（包括 devDependencies）
    const allDeps = [...pkg.dependencies, ...pkg.devDependencies];

    // 先处理所有依赖
    for (const dep of allDeps) {
      const depPkg = packages.find((p) => p.name === dep);
      if (depPkg && !visited.has(depPkg.name)) {
        visit(depPkg);
      }
    }

    sorted.push(pkg);
  }

  // 从每个包开始遍历
  for (const pkg of packages) {
    if (!visited.has(pkg.name)) {
      visit(pkg);
    }
  }

  return sorted;
}

export async function batchPublish({
  beta = false,
  packages,
}: BatchPublishOptions) {
  try {
    // 获取所有包信息
    const packageInfos = await Promise.all(
      packages.map((pkgName) => getPackageInfo(pkgName))
    );

    // 按依赖顺序排序包
    const sortedPackages = sortPackagesByDependencies(packageInfos);

    console.log("发布顺序：", sortedPackages.map((p) => p.name).join(" -> "));

    // 依次发布每个包
    for (const pkg of sortedPackages) {
      console.log(`\n开始发布 ${pkg.name}...`);
      try {
        await publishPackage({ packageName: pkg.name, isBeta: beta });
        console.log(`${pkg.name} 发布成功`);

        // 发送钉钉通知
        const version = new Package(pkg.name).version;
        await sendDingTalkNotification(`${pkg.name}@${version}`);
      } catch (err) {
        const error = err as Error;
        console.error(`发布 ${pkg.name} 失败:`, error);
        throw error;
      }
    }

    console.log("\n所有包发布完成！");
  } catch (err) {
    const error = err as Error;
    console.error("批量发布失败:", error);
    process.exit(1);
  }
} 
