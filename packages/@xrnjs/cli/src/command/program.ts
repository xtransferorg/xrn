import { Command } from "commander";
import logger from "../utlis/logger";
export const program = new Command();

const version = require("../../package.json").version;

program.version(version, "-v, --version");

program
  .name("xt-rn-cli")
  .command("version")
  .action(() => {
    logger.info(version);
  });
