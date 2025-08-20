import { buildJobContext } from "../BuildJobContext";
import logger from "../../utlis/logger";

export const manifestPrefix = "itms-services://?action=download-manifest&url=";

function getUploadPath(): string {
  const { platform, buildType, branchName, project } = buildJobContext;
  const ftpPath = `apps/${project}/${platform}/${buildType}/${branchName}/`;
  return ftpPath;
}

export function getRemoteFileUrl(fileName: string) {
  return `${getUploadDomain()}/${getUploadPath()}${fileName}`;
}

function getUploadDomain(): string {
  // TODO 插件化配置
  return "";
}


export async function uploadFileTo(localPath: string, remotePath: string) {
  // TODO 插件化处理
  // logger.warn('上传文件功能未实现');
  return ''
}

export async function uploadFile(filePath: string) {
  const ftpPath = getUploadPath();
  return uploadFileTo(filePath, ftpPath);
}
