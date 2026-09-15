import fs from "fs";
import { PackageJson, readPackageJson } from "../utlis/readPackageJson";
import { AppJson, readAppJsonFile } from "../utlis/readAppJsonFile";
import { XrnStartArgs } from "./types";
import logger from "../utlis/logger";
import path from "path";

class StartAppContext {
  appJsonConfig: AppJson;
  args: XrnStartArgs = {
  };
  packageJson: PackageJson;
  async init(args: XrnStartArgs) {
    this.args = args;
    if (fs.existsSync(path.join(process.cwd(), "app.json"))) {
      this.appJsonConfig = await readAppJsonFile(process.cwd());
      this.packageJson = await readPackageJson(process.cwd());
    }
    if (args.verbose) {
      logger.info(args);
    }
  }
}

export const startAppContext = new StartAppContext();
