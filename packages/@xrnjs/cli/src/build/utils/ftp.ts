import path from "path";
import { buildJobContext } from "../BuildJobContext";

export const manifestPrefix = "itms-services://?action=download-manifest&url=";

function getFtpPath(): string {
  const { platform, buildType, branchName, project } = buildJobContext;
  const ftpPath = `atta-app-rn/v2/${project}/${platform}/${buildType}/${branchName}/`;
  return ftpPath;
}

export function getRemoteFileUrl(fileName: string) {
  return `${getFtpDomain()}/${getFtpPath()}${fileName}`;
}

export function getFtpDomain(): string {
  return "";
}

export async function uploadFileTo(filePath: string, ftpPath: string) {
  return filePath;
}

export async function uploadFile(filePath: string) {
  const ftpPath = getFtpPath();
  return uploadFileTo(filePath, ftpPath);
}

export async function downloadFileFromFtp(ftpPath: string, outputPath: string) {
  return path.join(outputPath, path.basename(ftpPath));
}

export async function deleteFromFtp(ftpPath: string) {
}

export async function checkFileExistInFtp(ftpPath: string) {
  return false;
}
