import { DownloadFileOptions } from 'react-native-fs';


/**
 * 下载的文件类型
 */
export type DownloadFileType = 'pdf' | 'doc' | 'docx' | 'xls' | 'xlsx' | 'txt' | 'csv' | 'png' | 'jpg' | 'jpeg' | 'gif' | 'webp' | 'svg' | 'mp3' | 'mp4' | 'wav' | 'mov' | 'apk' | 'app' | 'hap' | 'ipa' | 'zip' | 'json';


/**
 * 下载到指定的沙盒目录，默认选择`CachesDirectoryPath`，这里的文件目录有平台差异性，使用时请根据具体场景选择适配
 * ● CachesDirectoryPath (String) The absolute path to the caches directory  缓存目录，下载的内容用户不可见，卸载App时沙盒数据会删除，内存不足时系统会主动清理数据，常用于户存储临时临时缓存数据，不支持iCloud备份
 * ● ExternalCachesDirectoryPath (String) The absolute path to the external caches directory (android only)  外部缓存目录，下载内容用户可见，App卸载时数据会删除
 * ● DocumentDirectoryPath (String) The absolute path to the document directory 文档目录，下载的内容用户可查看(在文件App中可以找到下载的内容)，卸载App时沙盒数据会删除，支持iCloud备份，常用于下载后用户可访问查看的数据
 * ● LibraryDirectoryPath (String) The absolute path to the NSLibraryDirectory (iOS only) 库目录，下载的内容用户不可见，卸载App时沙盒数据会删除，系统不会主动清理数据，支持iCloud备份，常用于重要的持久化存储的数据
 * ● ExternalDirectoryPath (String) The absolute path to the external files, shared directory (android only) 外部文件目录，下载内容用户可见，App卸载时不会删除
 */
export type DownloadSandboxPath = 'CachesDirectoryPath' | 'ExternalCachesDirectoryPath' | 'DocumentDirectoryPath' | 'LibraryDirectoryPath' | 'ExternalDirectoryPath';


/**
 * 文件路径校验
 */
export type FilePathCheck = Pick<FSDownloadFileOptions, 'fileName' | 'fileType' | 'directoryType'>


/**
 * fs文件下载配置参数
 */
export type FSDownloadFileOptions = Omit<DownloadFileOptions, 'toFile'> & {

  /**
   * 下载到沙盒的文件名称
   * 注意：这里的文件名称最好带有唯一标识属性，因为后面查询此文件是否已下载，需要文件有唯一标识特性
   */
	fileName: string

  /**
   * 下载文件的类型
   */
  fileType: DownloadFileType

  /**
   * 下载文件到沙盒哪层目录，默认值：CachesDirectoryPath
   */
  directoryType?: DownloadSandboxPath
};

/**
 * 省略掉沙盒路径属性的下载参数
 */
export type FSDownloadFileOmitDirOptions = Omit<FSDownloadFileOptions, 'directoryType'>;


/**
 * 文件操作额外自定义Code码
 */
export enum FileExtraStatus {

  /**
   * 901：创建文件夹失败
   */
  MKDIR_FAILED = 901,

  /**
   * 902：文件已存在
   */
  FILE_EXISTS = 902,
}


/**
 * 下载结果
 */
export type FileDownloadResult = {

  /**
   * 下载的文件路径
   */
  filePath?: string

  /**
   * The download job ID, required if one wishes to cancel the download. See `stopDownload`.
   */
  jobId?: number

  /**
   * The HTTP status code & 自定义FileExtraStatus码，注意：如果判断文件是否已下载过，对应的statusCode为902
   */
	statusCode: number

  /**
   * The number of bytes written to the file
   */
	bytesWritten?: number

  /**
   * 下载错误时，Error对象
   */
  error?: any
}

export type DownloadManagerStatic = {

  /**
   * 自定义下载的文件目录名称
   * 之所以新建一个文件夹，便于后期排查搜索已下载内容，所有XT业务后面的下载内容都可以收敛到一处
   * @returns string
   */
  nativeBizCacheFolderName: () => string;

  /**
   * 获取自定义的cache文件夹路径
   * @param directoryType 
   * @returns string
   */
  getCustomCacheDir: (directoryType?: DownloadSandboxPath) => string;

  /**
   * 获取文件在沙盒中的存储路径
   * 这里的文件名称最好带有唯一标识属性，因为后面查询此文件是否已下载，需要文件有唯一标识特性
   * @param fileName 
   * @param fileType 
   * @param directoryType 
   * @returns string
   */
  getDownloadFilePath: (
    fileName: string,
    fileType: DownloadFileType,
    directoryType?: DownloadSandboxPath
  ) => string;

  /**
   * 判断文件是否已下载过
   * @param fileName 
   * @param fileType 
   * @param directoryType 
   * @returns bool
   */
  isFileDownloaded: (
    fileName: string,
    fileType: DownloadFileType,
    directoryType?: DownloadSandboxPath
  ) => Promise<boolean>;

  /**
   * 检查访问的文件路径是否真实存在，如果不存在则创建对应的目录
   * @param path 
   * @returns Promise
   */
  ensureDirectoryExists: (path: string) => Promise<void>;

  /**
   * fs文件下载核心实现，如果不知道怎么选择沙盒目录，可以根据需求调用`downloadFileInnerApp`或者`downloadFileExternalApp`方法
   * @param options
   * @returns Promise
   */
  downloadFile: (options: FSDownloadFileOptions) => Promise<FileDownloadResult>;

  /**
   * fs文件下载，将文件下载到App内，App外部不可以访问此文件
   * @param options 
   * @returns Promise
   */
  downloadFileInnerApp: (options: FSDownloadFileOmitDirOptions) => Promise<FileDownloadResult>;

  /**
   * fs下载文件，将文件下载到App内，App外部可以访问此文件
   * @param options 
   * @returns Promise
   */
  downloadFileExternalApp: (options: FSDownloadFileOmitDirOptions) => Promise<FileDownloadResult>;
};
