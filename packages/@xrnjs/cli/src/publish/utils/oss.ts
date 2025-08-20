import OSS from "ali-oss";
import fs from "fs";
import logger from "../../utlis/logger";

const APP_BUCKET = process.env.APP_BUCKET;
const APP_ACCESS_KEY_ID = process.env.APP_ACCESS_KEY_ID;
const APP_ACCESS_KEY_SECRET = process.env.APP_ACCESS_KEY_SECRET;
const APP_REGION = process.env.APP_REGION;

const OSS_HTTP_DOMAIN = "https://static.xtransfer.com/";

export class MyOSSClient {
  client: OSS;

  init() {
    // 配置 OSS 客户端
    const client = new OSS({
      region: APP_REGION,
      accessKeyId: APP_ACCESS_KEY_ID,
      accessKeySecret: APP_ACCESS_KEY_SECRET,
      bucket: APP_BUCKET,
    });
    this.client = client;
  }

  // 上传文件函数
  async uploadFileToOSS(filePath: string, ossPath: string) {
    if (!this.client) {
      this.init();
    }

    // 读取文件
    const stream = fs.createReadStream(filePath);

    // 上传文件到 OSS
    const result = await this.client.putStream(ossPath, stream);

    const ossUrl = `${OSS_HTTP_DOMAIN}${result.name}`;
    logger.info("上传 oss 成功：" + ossUrl);

    return ossUrl;
  }
}
