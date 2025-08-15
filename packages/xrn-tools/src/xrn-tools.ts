/* eslint-disable import/order */
// import spawnAsync from "@expo/spawn-async"; // 不知道为啥，删了会有ts报错
import { Command } from "commander";

import { addDemoScreenToXrnGo } from "./addDemoScreenToXrnGo";
import { addLibToOhEntryDep } from "./addLibToOhEntryDep";
import { buildDepPackages } from "./buildDepPackages";
import { copyOhLibToPackage } from "./copyOhLibToPackage";
import { createHarmonyLib } from "./createHarmonyLib";
import { generateApiData } from "./generateApiData";
import { generateApiDoc } from "./generateApiDoc";
import {
  syncAllDependenciesAcrossWorkspaces,
  syncDependencyVersionAcrossWorkspaces,
} from "./syncDeps";
import { GenerateApiDataOptions, AddLibToOhEntryDep } from "./types";
import { choosePackage, execAsync, getWorkspacePackages } from "./utils";
import { syncScreensToPackages } from "./syncScreensToPackages";
import { generateScreensApiDoc } from "./generateScreensApiDoc";
import { publishPackage } from "./publishPackage";
import { batchPublish } from "./batchPublish";
import { Package } from "./utils/PackageUtils";

const packageJson = require("../package.json");

const program = new Command();

program
  .name(packageJson.name)
  .version(packageJson.version)
  .description(packageJson.description);

program
  .command("generate-api-data")
  .alias("gdad")
  .argument("<packageName>", "The package name to generate API data for.")
  .option(
    "-e, --entry-point <entryPoint>",
    "The entry point to generate API data for."
  )
  .option("-s, --sdk <version>", "将数据输出路径设置为具体的 SDK 版本")
  .description(`Extract API data JSON files for docs using TypeDoc.`)
  .action((argv: string, options: GenerateApiDataOptions) => {
    console.log("Generating API data for package:", { argv, options });
    options.packageName = argv;
    generateApiData(options);
  });

program
  .command("generate-api-doc")
  .alias("gdoc")
  .argument("<packageName>", "The package name to generate API data for.")
  .option(
    "-e, --entry-point <entryPoint>",
    "The entry point to generate API data for."
  )
  .option("-s, --sdk <version>", "将数据输出路径设置为具体的 SDK 版本")
  .description(`Extract API data JSON files for docs using TypeDoc.`)
  .action((argv: string, options: GenerateApiDataOptions) => {
    console.log("Generating API data for package:", { argv, options });
    options.packageName = argv;
    generateApiDoc(options);
  });

program
  .command("add-demo-screen-to-xrngo")
  .argument("<packageName>", "The package name to install.")
  .description(`在xrngo中添加一个 demo screen`)
  .action((packageName: string) => {
    addDemoScreenToXrnGo({ packageName });
  });

program
  .command("create-harmony-lib")
  .argument("<packageName>", "npm 包名")
  .argument("<harmonyModuleName>", "鸿蒙模块名")
  .description(`以及npm包中的代码，在xrngo中添加一个鸿蒙的二方库`)
  .action((packageName: string, harmonyModuleName: string) => {
    const options = { packageName, harmonyModuleName };
    console.log("create-harmony-lib", options);
    createHarmonyLib(options);
  });

program
  .command("copy-oh-lib-to-package")
  .argument("<packageName>", "npm 包名")
  .argument("<harmonyModuleName>", "鸿蒙模块名")
  .description(`将 xrngo 中的鸿蒙二方库复制到指定的 npm 包中`)
  .action((packageName: string, harmonyModuleName: string) => {
    const options = { packageName, harmonyModuleName };
    console.log("copy-oh-lib-to-package", options);
    copyOhLibToPackage(options);
  });

program
  .command("add-lib-to-oh-entry-dep")
  .argument("<packageName>", "npm 包名")
  .argument("<harmonyModuleName>", "鸿蒙模块名")
  .option("--source-code", "使用源码", false)
  .description(`将二方包依赖中的har包添加到xrngo entry的oh-package.json5中`)
  .action(
    (
      packageName: string,
      harmonyModuleName: string,
      options: AddLibToOhEntryDep
    ) => {
      Object.assign(options, { packageName, harmonyModuleName });
      // const options = { packageName, harmonyModuleName };
      console.log("add-lib-to-oh-entry-dep", options);
      addLibToOhEntryDep(options);
    }
  );

program
  .command("build-dep-packages")
  .argument("<packageName>", "npm 包名")
  .description(`打包依赖包`)
  .action((packageName: string) => {
    buildDepPackages(packageName);
  });

program
  .command("sync-all-dep-version")
  .description(`同步所有依赖版本`)
  .action(async () => {
    syncAllDependenciesAcrossWorkspaces();
  });

program
  .command("sync-dep-version")
  .argument("<packageName>", "npm 包名")
  .description(`同步单个依赖版本`)
  .action(async (packageName: string) => {
    syncDependencyVersionAcrossWorkspaces(packageName);
  });

program
  .command("select-sync-dep-version")
  .description(`选择一个包，同步单个依赖版本`)
  .action(async () => {
    const { name } = await choosePackage();
    syncDependencyVersionAcrossWorkspaces(name);
  });

program
  .command("sync-screens-to-packages")
  .description("将 screens.json 中的配置同步到对应包的 package.json 中")
  .action(async () => {
    await syncScreensToPackages();
  });

program
  .command("generate-screens-api-doc")
  .alias("gsad")
  .option("-s, --sdk <version>", "将数据输出路径设置为具体的 SDK 版本")
  .description("为 screens.json 中的所有包生成 API 文档")
  .action(async (options: GenerateApiDataOptions) => {
    await generateScreensApiDoc(options.sdk);
  });

program
  .command("publish")
  .argument("<packageName>", "要发布的 npm 包名")
  .option("-b, --beta", "是否发布 beta 版本", false)
  .description("发布单个 npm 包，支持发布正式版和 beta 版")
  .action(async (packageName: string, options: { beta: boolean }) => {
    await publishPackage({ packageName, isBeta: options.beta });
  });

program
  .command("batch-publish")
  .argument("<packages...>", "要发布的包名列表")
  .option("-b, --beta", "是否发布 beta 版本", false)
  .description(
    "批量发布指定的 npm 包，支持发布正式版和 beta 版，会自动处理依赖顺序"
  )
  .action(async (packages: string[], options: { beta: boolean }) => {
    await batchPublish({ packages, beta: options.beta });
  });

program
  .command("list-xrn-meta")
  .alias("lxm")
  .description("列出所有包的 XrnMeta 信息")
  .action(async () => {
    const metaList = Package.getXrnMetaList();
    console.log(JSON.stringify(metaList, null, 2));
  });

program
  .command("list-beta-packages")
  .description("显示所有非正式版包")
  .action(async () => {
    const { Package } = require("./utils/PackageUtils");
    // 筛选所有非正式版包
    const betaPackages = Package.getPackages().filter((pkg) =>
      /-/.test(pkg.version)
    );
    if (betaPackages.length === 0) {
      console.log("没有需要升级的非正式版包");
      return;
    }
    const names = betaPackages.map((pkg) => pkg.name).join(",");
    console.log("非正式版包列表: ", names);
  });

program
  .command("promote-beta-to-release")
  .description("将所有非正式版（beta/alpha/rc等）包升级为 patch 正式版")
  .action(async () => {
    const { Package } = require("./utils/PackageUtils");
    // 筛选所有非正式版包
    const betaPackages = Package.getPackages().filter((pkg) =>
      /-/.test(pkg.version)
    );
    if (betaPackages.length === 0) {
      console.log("没有需要升级的非正式版包");
      return;
    }
    const names = betaPackages.map((pkg) => pkg.name).join(",");
    const cmd = `npx lerna version patch --no-push --no-private --force-publish=${names} --yes`;
    console.log("执行命令:", cmd);
    const { execSync } = require("child_process");
    try {
      execSync(cmd, { stdio: "inherit" });
    } catch (e) {
      console.error("lerna version 执行失败", e);
    }
  });

program
  .command("install")
  .description("安装所有包的依赖")
  .action(async () => {
    const packages = await getWorkspacePackages();
    console.log("当前工作区的包列表：", packages);
    const result = await execAsync(`git rev-parse --abbrev-ref HEAD`);
    const { stdout } = result;
    const branch = stdout.trim();
    console.log("当前分支是：", branch);
    console.log('result', result);
    await execAsync("yarn install --no-immutable", { stdio: "inherit" });
  });

program.parse(process.argv);
