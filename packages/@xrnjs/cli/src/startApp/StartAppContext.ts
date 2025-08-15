import fs from "fs";
import path from "path";

import { XrnStartArgs } from "./types";
import logger from "../utlis/logger";
import { AppJson, readAppJsonFile } from "../utlis/readAppJsonFile";
import { PackageJson, readPackageJson } from "../utlis/readPackageJson";

/**
 * Global context manager for the start app process
 * Maintains application configuration and arguments throughout the app lifecycle
 * Provides a centralized way to access app.json and package.json configurations
 */
class StartAppContext {
  /** Application configuration from app.json */
  appJsonConfig: AppJson;
  
  /** Command line arguments and options */
  args: XrnStartArgs = {
    interactive: true,
  };
  
  /** Package configuration from package.json */
  packageJson: PackageJson;
  
  /**
   * Initialize the context with command line arguments and configuration files
   * Reads app.json and package.json if they exist in the current working directory
   * 
   * @param args - Command line arguments and options
   */
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

/**
 * Global instance of StartAppContext for use throughout the application
 */
export const startAppContext = new StartAppContext();
