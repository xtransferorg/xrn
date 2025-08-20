import archiver from "archiver";
import FormData from "form-data";
import fs from "fs-extra";
import moment from "moment";
import path from "path";
import unzipper from "unzipper";

import {
  BaseLineManager,
  UploadResult,
  QueryResult,
  BaseLineConfig,
} from "./BaseLineManager";
import { convertPlatform } from "../../build/utils";
import logger from "../../utlis/logger";
import request from "../../utlis/request";

export class ApiBaseLineManager extends BaseLineManager {
  async uploadBaseLine(): Promise<UploadResult[]> {
    const dir = this.baseDir;
    // 压缩目录
    const zipPath = path.join(
      path.dirname(dir),
      `v${this.config.app_version}_${moment().format("YYYY-MM-DD_HH:mm:ss")}_${this.config.environment}_${path.basename(dir)}.zip`,
    );
    await new Promise<void>((resolve, reject) => {
      const output = fs.createWriteStream(zipPath);
      const archive = archiver("zip", { zlib: { level: 9 } });
      output.on("close", resolve);
      archive.on("error", reject);
      archive.pipe(output);
      archive.directory(dir, false);
      archive.finalize();
    });
    // 上传zip
    const form = new FormData();
    form.append("file", fs.createReadStream(zipPath));
    form.append("app_version", this.config.app_version);
    form.append("name", this.config.app_name);
    form.append("platform", convertPlatform(this.config.platform));
    form.append("app_type", this.config.app_type);
    form.append("channel", this.config.channel);
    form.append("environment", this.config.environment);
    const headers = {
      ...form.getHeaders(),
    };
    const res = await request.post("/baseline/resource/upload", form, {
      headers,
    });
    // 删除本地zip
    await fs.remove(zipPath);
    if (res.data.code !== 0) {
      throw new Error(res.data.message || "上传基线文件失败");
    }
    return res.data.data;
  }

  async downloadBaseLineToLocal(): Promise<void> {
    const targetDir = process.cwd();
    const file = await this.queryFiles();
    const zipFileName = `${path.basename(this.baseDir)}.zip`;
    const zipPath = path.join(targetDir, zipFileName);
    const writer = fs.createWriteStream(zipPath);
    const response = await request.get(file.download_url, {
      responseType: "stream",
    });
    await new Promise((resolve, reject) => {
      response.data.pipe(writer);
      writer.on("finish", resolve);
      writer.on("error", reject);
    });
    await fs.ensureDir(this.baseDir);
    // 解压
    await fs
      .createReadStream(zipPath)
      .pipe(unzipper.Extract({ path: this.baseDir }))
      .promise();
    await fs.remove(zipPath);
  }

  async queryFiles(): Promise<QueryResult> {
    const params = {
      // file_names,
      name: this.config.app_name,
      app_version: this.config.app_version,
      platform: convertPlatform(this.config.platform),
      app_type: this.config.app_type,
      channel: this.config.channel,
      environment: this.config.environment,
    };
    const res = await request.get("/baseline/resource", {
      params,
    });
    if (res.data.code !== 0) {
      throw new Error(res.data.message || "查询基线文件失败");
    }
    return res.data.data;
  }
}
