import fsExtra from "fs-extra";
import path from "path";

/**
 * Interface defining the structure of package.json file
 * Contains essential package metadata and dependency information
 */
export interface PackageJson {
  /** Package name */
  name: string;
  /** Package version */
  version: string;
  /** Production dependencies */
  dependencies?: Record<string, string>;
  /** Development dependencies */
  devDependencies?: Record<string, string>;
  /** NPM scripts */
  scripts?: Record<string, string>;
}

/**
 * Read and parse package.json file from the specified project path
 * Loads package configuration and returns parsed PackageJson object
 * 
 * @param projectPath - Path to the project directory containing package.json
 * @returns Promise resolving to PackageJson configuration object
 */
export const readPackageJson = async (projectPath: string) => {
  const fileContent = await fsExtra.readFile(
    path.join(projectPath, "package.json"),
    "utf-8"
  );
  const appJson = JSON.parse(fileContent);
  return appJson as PackageJson;
};
