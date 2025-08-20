import RNFS from "react-native-fs";
import { Platform } from "@xrnjs/modules-core";
import {
  FSDownloadFileOptions,
  FileDownloadResult,
  FileExtraStatus,
  DownloadFileType,
  DownloadSandboxPath,
  DownloadManagerStatic,
  FSDownloadFileOmitDirOptions,
} from "./types";

/**
 * 缓存目录，下载的内容用户不可见，卸载App时沙盒数据会删除，内存不足时系统会主动清理数据，常用于户存储临时临时缓存数据，不支持iCloud备份
 */
const CachesDirectoryPath = `${RNFS.CachesDirectoryPath}`;

/**
 * Android only 外部缓存目录，下载内容用户可见，App卸载时数据会删除
 */
const ExternalCachesDirectoryPath = `${RNFS.ExternalCachesDirectoryPath}`;

/**
 * 文档目录，下载的内容用户可查看(在文件App中可以找到下载的内容)，卸载App时沙盒数据会删除，支持iCloud备份，常用于下载后用户可访问查看的数据
 */
const DocumentDirectoryPath = `${RNFS.DocumentDirectoryPath}`;

/**
 * iOS only 库目录，下载的内容用户不可见，卸载App时沙盒数据会删除，系统不会主动清理数据，支持iCloud备份，常用于重要的持久化存储的数据
 */
const LibraryDirectoryPath = `${RNFS.LibraryDirectoryPath}`;

/**
 * android only 外部文件目录，下载内容用户可见，App卸载时不会删除
 */
const ExternalDirectoryPath = `${RNFS.ExternalDirectoryPath}`;

// 文件下载管理类
export const XRNDownloadManager: DownloadManagerStatic = {
  /**
   * 自定义下载的文件目录名称
   * 之所以新建一个文件夹，便于后期排查搜索已下载内容，所有XT业务后面的下载内容都可以收敛到一处
   * @returns string
   */
  nativeBizCacheFolderName: (): string => {
    return "Downloads";
  },

  /**
   * 获取自定义的cache文件夹路径
   * @param directoryType
   * @returns string
   */
  getCustomCacheDir: (
    directoryType: DownloadSandboxPath = "CachesDirectoryPath"
  ): string => {
    let sandboxDocType = CachesDirectoryPath;
    if (directoryType === "CachesDirectoryPath") {
      sandboxDocType = CachesDirectoryPath;
    } else if (directoryType === "ExternalCachesDirectoryPath") {
      sandboxDocType = ExternalCachesDirectoryPath;
    } else if (directoryType === "DocumentDirectoryPath") {
      sandboxDocType = DocumentDirectoryPath;
    } else if (directoryType === "LibraryDirectoryPath") {
      sandboxDocType = LibraryDirectoryPath;
    } else if (directoryType === "ExternalDirectoryPath") {
      sandboxDocType = ExternalDirectoryPath;
    }
    const sandboxPath = `${sandboxDocType}/${XRNDownloadManager.nativeBizCacheFolderName()}`;
    return sandboxPath;
  },

  /**
   * 获取文件在沙盒中的存储路径
   * 注意：这里的文件名称最好带有唯一标识属性，因为后面查询此文件是否已下载，需要文件有唯一标识特性
   * @param fileName 文件名称，例如：xxx.pdf
   * @param fileType 文件类型，例如：pdf
   * @param directoryType 下载目录
   * @returns string
   */
  getDownloadFilePath: (
    fileName: string,
    fileType: DownloadFileType,
    directoryType?: DownloadSandboxPath
  ): string => {
    return `${XRNDownloadManager.getCustomCacheDir(directoryType)}/${fileName}.${fileType}`;
  },

  /**
   * 判断文件是否已下载过
   * @param param0 fileName
   * @param param1 fileType
   * @param param2 directoryType
   * @returns bool
   */
  isFileDownloaded: async (
    fileName: string,
    fileType: DownloadFileType,
    directoryType?: DownloadSandboxPath
  ): Promise<boolean> => {
    const path = XRNDownloadManager.getDownloadFilePath(
      fileName,
      fileType,
      directoryType
    );
    const exists = await RNFS.exists(path);
    return exists;
  },

  /**
   * 检查访问的文件路径是否真实存在，如果不存在则创建对应的目录，因为有自定义目录`Downloads`，所以首次下载一定会`mkdir`创建目录
   * @param path
   */
  ensureDirectoryExists: async (path: string): Promise<void> => {
    try {
      const exists = await RNFS.exists(path);
      if (!exists) {
        await RNFS.mkdir(path);
        console.log("Downloads文件夹创建成功！");
      }
    } catch (e) {
      console.log("创建目录失败:", e);
    }
  },

  /**
   * fs文件下载核心实现，如果不知道怎么选择沙盒目录，可以根据需求调用`downloadFileInnerApp`或者`downloadFileExternalApp`方法
   * @param fromUrl fileName fileType directoryType headers background  begin progress
   * @returns Promise<FileDownloadResult>
   */
  downloadFile: async ({
    fromUrl,
    fileName,
    fileType,
    directoryType = "CachesDirectoryPath",
    headers = {},
    background = true,
    begin,
    progress,
  }: FSDownloadFileOptions): Promise<FileDownloadResult> => {
    // 获取沙盒存储目录
    const cacheDir = XRNDownloadManager.getCustomCacheDir(directoryType);

    try {
      await XRNDownloadManager.ensureDirectoryExists(cacheDir);

      const exists = await RNFS.exists(cacheDir);
      if (!exists) {
        console.log("Downloads文件夹创建失败！");
        return {
          statusCode: FileExtraStatus.MKDIR_FAILED,
          filePath: cacheDir,
        };
      }

      // /var/mobile/Containers/Data/Application/966E1D25-E3A7-4FAB-A314-9EC73AB6A8DB/Documents/Downloads/doc11.pdf
      const filePath = `${cacheDir}/${fileName}.${fileType}`;

      const existsPath = await RNFS.exists(filePath);
      if (existsPath) {
        console.log("此文件已下载过！");
        return {
          statusCode: FileExtraStatus.FILE_EXISTS,
          filePath,
        };
      }

      // 临时路径唯一性拼接规则：tmp_mbzyxhcs_v0rf2z
      const tempStr = `tmp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

      // /var/mobile/Containers/Data/Application/966E1D25-E3A7-4FAB-A314-9EC73AB6A8DB/Documents/Downloads/doc11_tmp_mbzyxhcs_v0rf2z.pdf
      const tempPath = `${cacheDir}/${fileName}_${tempStr}.${fileType}`;

      // 先下载到临时文件路径下
      const response = await RNFS.downloadFile({
        fromUrl,
        toFile: tempPath,
        headers,
        background,
        begin,
        progress,
      }).promise;

      // 非200，表示下载失败，直接终止流程
      if (response.statusCode !== 200) {
        if (await RNFS.exists(tempPath)) {
          await RNFS.unlink(tempPath);
        }

        return {
          statusCode: response?.statusCode,
          filePath: tempPath,
        };
      }

      // 临时文件拷贝到目标路径，这里不需要再做`unlink`逻辑，因为是`moveFile`
      await RNFS.moveFile(tempPath, filePath);

      return {
        jobId: response.jobId,
        statusCode: response.statusCode,
        bytesWritten: response.bytesWritten,
        filePath: filePath,
      };
    } catch (error) {
      console.log("文件下载失败：", error);
      let statusCode = -1;
      if (error && typeof error === "object" && "code" in error) {
        statusCode = (error as any).code;
      }

      return {
        statusCode,
        filePath: XRNDownloadManager.getDownloadFilePath(
          fileName,
          fileType,
          directoryType
        ),
        error,
      };
    }
  },

  /**
   * fs文件下载，将文件下载到App内，App外部不可以访问此文件
   * @param param0
   * @returns Promise<FileDownloadResult>
   */
  downloadFileInnerApp: async (
    args: FSDownloadFileOmitDirOptions
  ): Promise<FileDownloadResult> => {
    const result = XRNDownloadManager.downloadFile({
      ...args,
      directoryType: "CachesDirectoryPath",
    });
    return result;
  },

  /**
   * fs下载文件，将文件下载到App内，App外部可以访问此文件
   * @param param0
   * @returns Promise<FileDownloadResult>
   */
  downloadFileExternalApp: async (
    args: FSDownloadFileOmitDirOptions
  ): Promise<FileDownloadResult> => {
    // 根据不同的平台，选择不同的沙盒路径
    let directoryType: DownloadSandboxPath = "CachesDirectoryPath";
    if (Platform.OS === "ios") {
      directoryType = "DocumentDirectoryPath";
    } else if (Platform.OS === "android") {
      directoryType = "ExternalDirectoryPath";
    } else if (Platform.OS === "harmony") {
      directoryType = "ExternalCachesDirectoryPath";
    }
    const result = XRNDownloadManager.downloadFile({
      ...args,
      directoryType,
    });
    return result;
  },
};
