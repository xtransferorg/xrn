import path from "path";
import fs from "fs-extra";
import crypto from "crypto";
import { baselineSdk } from "@xrnjs/code-push-cli";
import { BaseLineFileType } from "@xrnjs/code-push-core/dist/types";
import type {
  BaselineMeta,
  NativeAppType,
  BaselineDownloadModel,
  BaselineDownload,
} from "@xrnjs/code-push-core/dist/types";
import axios from "axios";
import { BuildEnv, BuildType, Platform } from "./typing";
import ora from "ora";
import { convertBaseLineEnv } from "../codePush/diff";
import logger from "../utlis/logger";
import type { SchemaType } from "@react-native/codegen/lib/CodegenSchema";
import { getBundleName, getBundleMapName } from "./bundle/utils";
import { BundleExt } from "./bundle/constant";

export { BaseLineFileType };

// 添加writeFile的options接口定义
export interface WriteFileOptions {
  dirName?: string;
}
// 添加options接口定义
export interface MoveFileOptions {
  hash?: string;
  autoGenerateHash?: boolean;
  dirName?: string;
  rename?: string;
}

// 文件信息接口
export interface FileInfo {
  fileName: string;
  hash: string;
  content: string;
  size: number;
  appName: string;
}

// BaselineManager构造参数接口
export interface BaselineManagerConfig {
  platform: Platform;
  buildEnv: BuildEnv;
  buildType: BuildType;
  version: string;
}

export class BaselineManager {
  private platform: Platform;
  private buildEnv: BuildEnv;
  private buildType: BuildType;
  private baselineDir: string;
  private version: string;
  private fileMap: Map<BaseLineFileType, FileInfo>;
  private baselineList: BaselineDownloadModel = [];

  constructor(config: BaselineManagerConfig) {
    this.platform = config.platform;
    this.buildEnv = config.buildEnv;
    this.buildType = config.buildType;
    this.version = config.version;
    this.baselineDir = path.join(process.cwd(), ".baseline", this.version);

    // 使用Proxy包装Map以监听set事件
    const originalMap = new Map<BaseLineFileType, FileInfo>();
    this.fileMap = new Proxy(originalMap, {
      get: (target, prop, receiver) => {
        if (prop === "set") {
          return (key: BaseLineFileType, value: FileInfo) => {
            // 更新meta.json文件
            this.updateMetaJson(key, value);
            return target.set(key, value);
          };
        }
        const value = Reflect.get(target, prop, receiver);
        // ⭐ 如果是函数，绑定 Map 实例
        if (typeof value === "function") {
          return value.bind(target);
        }
        return value;
      },
    });
  }

  // 获取构造参数的方法
  getPlatform(): Platform {
    return this.platform;
  }

  getBuildEnv(): BuildEnv {
    return this.buildEnv;
  }

  getBuildType(): BuildType {
    return this.buildType;
  }

  getBaselineDir(): string {
    return this.baselineDir;
  }

  getVersion(): string {
    return this.version;
  }

  cleanBaselineDir() {
    try {
      fs.rmSync(this.baselineDir, {
        recursive: true,
        force: true,
      });
      fs.mkdirSync(this.baselineDir, { recursive: true });
      return this.baselineDir;
    } catch (error) {
      console.error("创建临时目录失败:", error);
      throw new Error(`无法创建临时目录: ${error.message}`);
    }
  }

  /**
   * 通过文件流生成 hash 值
   * @param filePath 文件路径
   * @returns hash值
   */
  private generateHash(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash("sha256");
      const stream = fs.createReadStream(filePath);
      stream.on("data", (chunk: Buffer) => hash.update(chunk as unknown as Uint8Array));
      stream.on("end", () => resolve(hash.digest("hex")));
      stream.on("error", reject);
    });
  }

  /**
   * 更新meta.json文件
   * @param fileType 文件类型
   * @param fileInfo 文件信息
   */
  private updateMetaJson(fileType: BaseLineFileType, fileInfo: FileInfo): void {
    try {
      const metaPath = path.join(this.baselineDir, "meta.json");
      let metaData: any = {
        version: "1.0",
        description: "Baseline directory structure metadata",
        created_at: new Date().toISOString().split("T")[0],
        files: [],
      };

      // 如果meta.json已存在，读取现有内容
      if (fs.existsSync(metaPath)) {
        const existingContent = fs.readFileSync(metaPath, "utf8");
        metaData = JSON.parse(existingContent);
      }

      // 确保files数组存在
      if (!metaData.files) {
        metaData.files = [];
      }

      // 查找是否已存在相同文件名的记录
      const existingFileIndex = metaData.files.findIndex(
        (file: any) => file.path === fileInfo.fileName && file.type === fileType
      );

      const fileEntry = {
        path: fileInfo.fileName,
        type: fileType,
        size: fileInfo.size,
        hash: fileInfo.hash,
        appName: fileInfo.appName,
        coverable: true,
      };

      if (existingFileIndex >= 0) {
        // 更新现有记录
        metaData.files[existingFileIndex] = fileEntry;
      } else {
        // 添加新记录
        metaData.files.push(fileEntry);
      }

      // 写入更新后的meta.json
      fs.writeFileSync(metaPath, JSON.stringify(metaData, null, 2), "utf8");
    } catch (error) {
      console.error("更新meta.json失败:", error);
    }
  }

  /**
   * 将内容写入临时目录中的指定文件，并存储到Map中
   * @param fileType 文件类型枚举
   * @param fileName 文件名称
   * @param content 文件内容
   * @param options 配置选项
   * @returns 写入文件的完整路径
   */
  async writeFileToTempDir(
    fileType: BaseLineFileType,
    fileName: string,
    content: string,
    appName: string,
    options: WriteFileOptions = {}
  ): Promise<string> {
    try {
      const { dirName } = options;
      // 确定目标目录
      let targetDir = this.baselineDir;
      if (dirName) {
        targetDir = path.join(this.baselineDir, dirName);
        // 如果指定了dirName，创建子目录
        fs.mkdirSync(targetDir, { recursive: true });
      }

      const filePath = path.join(targetDir, fileName);
      fs.writeFileSync(filePath, content, "utf8");

      const size = fs.statSync(filePath).size;

      // 通过文件流生成hash并存储到Map中
      const hash = await this.generateHash(filePath);
      const fileInfo: FileInfo = {
        fileName: `${dirName ? dirName + "/" : ""}${fileName}`,
        hash,
        content,
        size,
        appName,
      };

      this.fileMap.set(fileType, fileInfo);

      return filePath;
    } catch (error) {
      console.error("写入文件失败:", error);
      throw new Error(`无法写入文件 ${fileName}: ${error.message}`);
    }
  }

  /**
   * 将文件移动到临时目录中，并存储到Map中
   * 备注：当前的使用场景是将common包构建产物读取到当前manager临时目录下
   * @param fileType 文件类型枚举
   * @param filePath 源文件路径
   * @param options 配置选项
   * @returns 移动后文件的完整路径
   */
  async moveFileToTempDir(
    fileType: BaseLineFileType,
    filePath: string,
    appName: string,
    options: MoveFileOptions = {}
  ): Promise<string> {
    try {
      const { autoGenerateHash = true, dirName, rename, hash } = options;
      const fileName = rename || path.basename(filePath);

      // 确定目标目录
      let targetDir = this.baselineDir;
      if (dirName) {
        targetDir = path.join(this.baselineDir, dirName);
        // 如果指定了dirName，创建子目录
        fs.mkdirSync(targetDir, { recursive: true });
      }

      const targetPath = path.join(targetDir, fileName);

      // 复制文件到目标目录
      fs.copyFileSync(filePath, targetPath);

      const size = fs.statSync(targetPath).size;

      // 通过文件流生成hash并存储到Map中
      const fileHash = hash ?? (autoGenerateHash ? await this.generateHash(targetPath) : null);
      const fileInfo: FileInfo = {
        fileName: `${dirName ? dirName + "/" : ""}${fileName}`,
        hash: fileHash,
        content: null,
        size,
        appName,
      };

      this.fileMap.set(fileType, fileInfo);

      return targetPath;
    } catch (error) {
      console.error("移动文件失败:", error);
      throw new Error(`无法移动文件 ${filePath}: ${error.message}`);
    }
  }

  /**
   * 获取指定类型的文件信息
   * @param fileType 文件类型
   * @returns 文件信息或undefined
   */
  getFileInfo(fileType: BaseLineFileType): FileInfo | undefined {
    return this.fileMap.get(fileType);
  }

  /**
   * 获取所有文件信息
   * @returns 文件信息Map
   */
  getAllFileInfo(): Map<BaseLineFileType, FileInfo> {
    return new Map(this.fileMap);
  }

  /**
   * 清除指定类型的文件信息
   * @param fileType 文件类型
   */
  removeFileInfo(fileType: BaseLineFileType): boolean {
    return this.fileMap.delete(fileType);
  }

  async uploadFiles(meta: BaselineMeta, includeFileTypes?: BaseLineFileType[]) {
    let uploadDir = this.baselineDir;
    let tempDir: string | undefined;

    if (includeFileTypes && includeFileTypes.length > 0) {
      // 只上传指定类型的文件，创建临时目录
      tempDir = path.join(this.baselineDir, '__upload_tmp__');
      fs.mkdirSync(tempDir, { recursive: true });
      try {
        const metaFiles: Array<{ path: string; type: BaseLineFileType; size: number; hash: string; appName: string; coverable: boolean }> = [];
        for (const fileType of includeFileTypes) {
          const fileInfo = this.fileMap.get(fileType);
          if (!fileInfo) {
            continue;
          }
          const srcPath = path.join(this.baselineDir, fileInfo.fileName);
          const destPath = path.join(tempDir, fileInfo.fileName);
          fs.mkdirSync(path.dirname(destPath), { recursive: true });
          fs.copyFileSync(srcPath, destPath);
          metaFiles.push({
            path: fileInfo.fileName,
            type: fileType,
            size: fileInfo.size,
            hash: fileInfo.hash,
            appName: fileInfo.appName,
            coverable: true,
          });
        }
        // 生成仅包含本次上传文件条目的 meta.json
        const metaContent = {
          version: "1.0",
          description: "Baseline directory structure metadata",
          created_at: new Date().toISOString().split("T")[0],
          files: metaFiles,
        };
        fs.writeFileSync(path.join(tempDir, "meta.json"), JSON.stringify(metaContent, null, 2), "utf8");
        uploadDir = tempDir;
      } catch (error) {
        fs.removeSync(tempDir);
        throw error;
      }
    }

    try {
      return;
      const res = await baselineSdk.uploadBaseline(uploadDir, meta);
      // if (!res.length) {
      //   throw new Error('上传基线失败，返回结果为空');
      // }
    } finally {
      if (tempDir) {
        fs.removeSync(tempDir);
      }
    }
  }

  hasBaselineFile(fileType: BaseLineFileType) {
    return this.baselineList.some((item) => item.file_type === fileType);
  }

  /**
   * 获取完整的基线数据列表并保存到私有变量中
   */
  async fetchBaselineList() {
    return [];
    this.baselineList = await baselineSdk.getBaselineDownloadInfo({
      platform: this.platform,
      version_name: this.version,
      app_type: this.buildType as unknown as NativeAppType,
    });
    return this.baselineList;
  }

  async downloadFiles({
    file_types,
    excludeFileTypes,
    filter,
  }: {
    file_types?: BaseLineFileType[];
    excludeFileTypes?: BaseLineFileType[];
    filter?: (item: BaselineDownload) => boolean;
  } = {}) {
    // 如果基线列表为空，先获取完整列表
    if (this.baselineList.length === 0) {
      await this.fetchBaselineList();
    }

    // 根据file_type过滤列表
    let filteredList = this.baselineList;
    if (file_types && file_types.length > 0) {
      filteredList = this.baselineList.filter(
        (item) => file_types.includes(item.file_type)
      );
    }

    if (excludeFileTypes && excludeFileTypes.length > 0) {
      filteredList = filteredList.filter(
        (item) => !excludeFileTypes.includes(item.file_type)
      );
    }

    if (filter) {
      filteredList = filteredList.filter(filter);
    }

    if (!Array.isArray(filteredList) || filteredList.length === 0) {
      return;
    }

    const o = ora();
    o.info(`开始下载基线文件，共 ${filteredList.length} 个文件...`);
    o.start();
    await Promise.all(
      filteredList.map(async (item) => {
        const fileName = item.file_name;
        const url: string = item.url;
        if (!fileName || !url) return;

        const targetPath = path.join(this.baselineDir, fileName);
        const targetDir = path.dirname(targetPath);
        fs.mkdirSync(targetDir, { recursive: true });

        const response = await axios.get(url, { responseType: "arraybuffer" });
        fs.writeFileSync(
          targetPath,
          new Uint8Array(response.data as ArrayBuffer)
        );
      })
    );
    o.succeed(`基线文件下载完成`);
  }

  clean() {
    this.fileMap.clear();
    this.baselineList = [];
  }

  getAppBaselineInfo(fileType: BaseLineFileType) {
    const { buildEnv, platform, buildType } = this;
    const environment = convertBaseLineEnv(buildEnv);
    const base = this.baselineDir;

    switch (fileType) {
      case BaseLineFileType.META: {
        const metaFileName = `${environment}_${buildType}_${platform}_meta.json`;
        const metaFilePath = path.join(base, metaFileName);
        return {
          fileName: metaFileName,
          filePath: metaFilePath,
        };
      }
      case BaseLineFileType.RAW: {
        const rawFileName = `${environment}-${platform}-raw-baseline.txt`;
        const rawFilePath = path.join(base, rawFileName);
        return {
          fileName: rawFileName,
          filePath: rawFilePath,
        };
      }
      case BaseLineFileType.NATIVE_SIGNATURE: {
        const signatureFileName = `${environment}-${platform}-signature-schema.json`;
        const signatureFilePath = path.join(base, signatureFileName);
        return {
          fileName: signatureFileName,
          filePath: signatureFilePath,
        };
      }
      case BaseLineFileType.BUNDLE_RESOURCES: {
        const resourcesFileName = `${environment}-${platform}-resources-baseline.txt`;
        const resourcesFilePath = path.join(base, resourcesFileName);
        return {
          fileName: resourcesFileName,
          filePath: resourcesFilePath,
        };
      }
      case BaseLineFileType.COMMON: {
        const commonFileName = getBundleName(platform);
        const commonFilePath = path.join(base, commonFileName);
        return {
          fileName: commonFileName,
          filePath: commonFilePath,
        };
      }
      case BaseLineFileType.COMMON_MAP: {
        const commonMapFileName = getBundleMapName(platform);
        const commonMapFilePath = path.join(base, commonMapFileName);
        return {
          fileName: commonMapFileName,
          filePath: commonMapFilePath,
        };
      }
      default:
        throw new Error(`不支持获取该类型的基线信息: ${fileType}`);
    }
  }

  getBundleBaselineInfo(bundleName: string, fileType: BaseLineFileType) {
    const { buildEnv, platform } = this;
    const environment = convertBaseLineEnv(buildEnv);
    const base = this.baselineDir;
    const bundleDir = path.join(base, bundleName);

    switch (fileType) {
      case BaseLineFileType.BUNDLE_BUILD_PRODUCT: {
        const bundleBuildProductFileName = `bundle_product.zip`;
        const bundleBuildProductFilePath = path.join(
          bundleDir,
          bundleBuildProductFileName
        );
        return {
          fileName: bundleBuildProductFileName,
          filePath: bundleBuildProductFilePath,
          bundleName,
          bundleDir,
        };
      }
      case BaseLineFileType.BUNDLE_RESOURCE: {
        const bundleResourceFileName = `${environment}-${platform}-baseline.txt`;
        const bundleResourceFilePath = path.join(
          bundleDir,
          bundleResourceFileName
        );
        return {
          fileName: bundleResourceFileName,
          filePath: bundleResourceFilePath,
          bundleName,
          bundleDir,
        };
      }
      case BaseLineFileType.BASE_PACKAGE: {
        const bundleOutputFileName = `release_${platform}.zip`;
        const bundleOutputFilePath = path.join(bundleDir, bundleOutputFileName);
        return {
          fileName: bundleOutputFileName,
          filePath: bundleOutputFilePath,
          bundleName,
          bundleDir,
        };
      }
      case BaseLineFileType.HBC_BASELINE: {
        const ext = BundleExt[platform] || 'bundle';
        const hbcBaselineFileName = `${environment}-${platform}-hbc-baseline.${ext}`;
        const hbcBaselineFilePath = path.join(bundleDir, hbcBaselineFileName);
        return {
          fileName: hbcBaselineFileName,
          filePath: hbcBaselineFilePath,
          bundleName,
          bundleDir,
        };
      }
      default:
        throw new Error(`不支持获取该类型的Bundle基线信息: ${fileType}`);
    }
  }

  // 管理基线文件结构
  baseRepoManage() {
    // 基线仓库路径
    const base = this.baselineDir;
    const { buildEnv, platform, buildType } = this;
    const environment = convertBaseLineEnv(buildEnv);
    const manage = {
      base,
      pkg: {
        getFileName() {
          if (!buildType) throw new Error("buildType 不能为空");
          return `${environment}_${buildType}_${platform}_meta.json`;
        },
        get() {
          const p1 = path.join(base, manage.pkg.getFileName());
          logger.debug(`获取到的 meta.json 文件路径是: ${p1}`);
          return p1;
        },
      },
      // svg文件
      raw: {
        getFileName() {
          return `${environment}-${platform}-raw-baseline.txt`;
        },
        get() {
          const p1 = path.join(base, manage.raw.getFileName());
          logger.debug(`获取到的 raw 文件路径是: ${p1}`);
          return p1;
        },
      },
      signature: {
        getFileName() {
          return `${environment}-${platform}-signature-schema.json`;
        },
        get() {
          const p1 = path.join(base, manage.signature.getFileName());
          logger.debug(`获取到的 signature-schema.json 文件路径是: ${p1}`);
          return p1;
        },
      },
      resources: {
        getFileName() {
          return `${environment}-${platform}-resources-baseline.txt`;
        },
        get() {
          const p1 = path.join(base, manage.resources.getFileName());
          logger.debug(`获取到的 resources-baseline.txt 文件路径是: ${p1}`);
          return p1;
        },
      },
    };
    return manage;
  }

  async getSignatureJson() {
    // 读取基线完整 schema
    const signatureFile = this.baseRepoManage().signature.get();
    if (!fs.existsSync(signatureFile)) {
      await this.downloadFiles({
        file_types: [BaseLineFileType.NATIVE_SIGNATURE],
      });
    }

    const raw = await fs.readFile(signatureFile, "utf-8");
    const json: SchemaType = JSON.parse(raw);
    // 期望是完整 schema 结构
    return json;
  }
}
