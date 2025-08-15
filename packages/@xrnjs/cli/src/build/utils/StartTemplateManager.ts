import fs from "fs-extra";
import path from "path";
import { readAppJsonFile } from "../../utlis/readAppJsonFile";
import { AppJson } from "../../utlis/readAppJsonFile";
import logger from "../../utlis/logger";

export class StartTemplateManager {
  private projectPath: string;
  private templatePath: string;
  private indexTsPath: string;
  private appJson: AppJson;
  private constructor(projectPath: string, appJson: AppJson) {
    this.projectPath = projectPath;
    this.appJson = appJson;

    const templatePath = path.resolve(
      this.projectPath,
      "node_modules/xt-rn-core/templates/index.bundle.template"
    );
    this.templatePath = templatePath;
    const indexTsPath = path.resolve(this.projectPath, "index.ts");
    this.indexTsPath = indexTsPath;
  }
  static async create(projectPath: string) {
    const appJson = await readAppJsonFile(projectPath);
    return new StartTemplateManager(projectPath, appJson);
  }
  // 写入 index.ts 文件
  async writeIndexTs() {
    if (!this.appJson.useIndexTemplate) {
      return;
    }
    // 如果存在，则替换中的 index.ts
    if (fs.existsSync(this.templatePath) && fs.existsSync(this.indexTsPath)) {
      await fs.copy(this.templatePath, this.indexTsPath, {
        overwrite: true,
      });
    } else {
      logger.warn("index.ts 文件或模板文件不存在，请检查文件是否存在");
    }
  }

  // 检查 index.ts 文件是否修改
  async checkIfIndexTsModify() {
    if (!this.appJson.useIndexTemplate) {
      return false;
    }
    if (fs.existsSync(this.indexTsPath) && fs.existsSync(this.templatePath)) {
      const indexTsContent = await fs.readFile(this.indexTsPath, "utf-8");
      const templateContent = await fs.readFile(this.templatePath, "utf-8");
      if (indexTsContent !== templateContent) {
        return true;
      }
    } else {
      logger.warn("index.ts 文件或模板文件不存在，请检查文件是否存在");
    }
    return false;
  }
  // 断言 index.ts 文件是否修改
  async assertIndexTsModify() {
    if (await this.checkIfIndexTsModify()) {
      throw new Error("index.ts 文件已修改，请检查文件内容");
    }
  }
}
