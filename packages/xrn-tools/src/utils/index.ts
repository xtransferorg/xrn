/* eslint-disable import/order */
import { execSync } from "child_process";
import path from "path";
import inquirer from "inquirer";
import fs from "fs";

import { XRN_DIR } from "../Constants";
import { DocNavigation, NavSDK } from "../docConstants";
const execShPromise = require("exec-sh").promise;

export const execAsync = (
  command,
  opts: { stdio: "inherit" | null } = { stdio: null },
): Promise<{ stdout: string; stderr: string }> => {
  console.log("执行命令:", command);
  return execShPromise(command, {
    ...opts,
  });
};

export const generateDocsStaticResources = () => {
  const DOCS_DIR = path.join(XRN_DIR, "docs");
  execSync(`yarn generate-static-resources`, { cwd: DOCS_DIR });
};

interface PackageInfo {
  location: string;
  name: string;
}

export const getWorkspacePackages = async () => {
  const res = await execAsync(`yarn workspaces list --json`);
  const { stdout } = res;
  const packages = stdout
    .split("\n")
    .filter(Boolean)
    .map((it) => {
      try {
        return JSON.parse(it) as PackageInfo;
      } catch (error) {
        console.error(error);
        return null;
      }
    })
    .filter(Boolean);
  return packages as PackageInfo[];
};

export const findWorkspacePackage = async (packageName: string) => {
  const packages = await getWorkspacePackages();
  return packages.find((it) => it.name === packageName);
};

export const getPackageJsonByName = async (packageName: string) => {
  const packageInfo = await findWorkspacePackage(packageName);
  if (!packageInfo) {
    return null;
  }
  const packageJsonPath = path.join(
    XRN_DIR,
    packageInfo.location,
    "package.json",
  );
  const currentPackageJson = JSON.parse(
    fs.readFileSync(packageJsonPath, "utf-8"),
  );
  return currentPackageJson as { name: string; version: string };
};

// 让用户选择一个二方包
export const choosePackage = async (): Promise<PackageInfo> => {
  // 获取工作区中所有的包
  const packages = (await getWorkspacePackages()).filter(
    (pkg) => pkg.name.startsWith("xt-rn") || pkg.name.startsWith("xrn-"),
  );

  // 通过 inquirer 提示用户选择一个包
  const { selectedPackage } = await inquirer.prompt([
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

export const readDocConstantsFile = (filename: string) => {
  return JSON.parse(
    fs.readFileSync(path.join(XRN_DIR, "docs", "constants", filename), "utf-8"),
  ) as DocNavigation;
};

export const createNewNavigation = async () => {
  const { name } = await inquirer.prompt([
    {
      type: "input",
      name: "name",
      message: "请输入新导航的名称:",
      validate: (input: string) => {
        if (!input.trim()) {
          return "名称不能为空";
        }
        return true;
      },
    },
  ]);

  const { directory } = await inquirer.prompt([
    {
      type: "input",
      name: "directory",
      message: "请输入新导航的目录名:",
      validate: (input: string) => {
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

  const newNavigation: NavSDK = { name, directory };
  const configPath = path.join(
    XRN_DIR,
    "docs",
    "constants",
    "navigation-config.json",
  );

  const config: DocNavigation = readDocConstantsFile("navigation-config.json");
  config.sdk = [...config.sdk, newNavigation];
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

  return newNavigation;
};

export const chooseApiType = async (): Promise<string> => {
  const navigationConfig = readDocConstantsFile("navigation-config.json");
  let choices = navigationConfig.sdk.map((it) => ({
    name: it.name,
    value: it.directory,
  }));

  // 添加创建新导航选项
  choices = [...choices, { name: "+ 创建新导航", value: "CREATE_NEW" }];

  const { selectedDir } = await inquirer.prompt([
    {
      type: "list",
      name: "selectedDir",
      message: "请选择API类型:",
      choices,
    },
  ]);

  if (selectedDir === "CREATE_NEW") {
    const newNavigation = await createNewNavigation();
    return newNavigation.directory;
  }

  return selectedDir;
};

export async function sendDingTalkNotification(message: string) {
  console.log("sendDingTalkNotification", message);
}
