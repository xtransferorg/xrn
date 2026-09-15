import path from "path";
import { XRNConfigType } from "../typing";
import fsExtra from "fs-extra";
import logger from "../../utlis/logger";

export const readXrnConfigJson = async (
  projectPath: string,
  {
    throwError = true,
  }: {
    throwError?: boolean;
  }
): Promise<XRNConfigType | null> => {
  try {
    const fileContent = await fsExtra.readFile(
      path.join(projectPath, "xrn.config.json"),
      "utf-8"
    );
    const appJson = JSON.parse(fileContent);
    return appJson as XRNConfigType;
  } catch (error) {
    const info = `读取${projectPath}/xrn.config.json文件失败，请检查文件是否存在！`;
    if (throwError) {
      logger.error(info);
      process.exit(1);
    } else {
      logger.warn(info);
      return null;
    }
  }
};
