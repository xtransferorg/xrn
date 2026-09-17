import fsExtra from "fs-extra";
import path from "path";

export interface PackageJson {
  name: string;
  version: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
}

// 读取 package.json 文件
export const readPackageJson = async (projectPath: string) => {
  const fileContent = await fsExtra.readFile(
    path.join(projectPath, "package.json"),
    "utf-8"
  );
  const appJson = JSON.parse(fileContent);
  return appJson as PackageJson;
};
