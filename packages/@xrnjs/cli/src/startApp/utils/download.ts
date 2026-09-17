/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import fs from "fs";
import path from "path";
import axios from "axios";
import ProgressBar from "progress";
import fsExtra from 'fs-extra'
import os from "os";

// 下载文件并显示进度
async function downloadFile(
  fileUrl: string,
  downloadPath: string
): Promise<void> {
  const writer = fs.createWriteStream(downloadPath);

  const response = await axios({
    url: fileUrl,
    method: "GET",
    responseType: "stream",
  });

  const totalLength: string = response.headers["content-length"];

  console.log("Starting download...");

  const progressBar = new ProgressBar("-> downloading [:bar] :percent :etas", {
    width: 40,
    complete: "=",
    incomplete: " ",
    renderThrottle: 16,
    total: parseInt(totalLength),
  });

  response.data.on("data", (chunk: Buffer) => progressBar.tick(chunk.length));
  response.data.pipe(writer);

  return new Promise<void>((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
}

const appDownloadDir = path.join(os.tmpdir(), 'xrn-app-download-dir');
async function download(
  fileUrl: string,
  downloadDir = appDownloadDir
): Promise<string> {
  console.log(`Downloading file from ${fileUrl}`);
  if (!fileUrl) {
    throw new Error("Error: No URL provided");
  }
  const fileName = path.basename(new URL(fileUrl).pathname);
  fsExtra.ensureDirSync(downloadDir);
  const downloadPath = path.join(downloadDir, fileName);

  if (fs.existsSync(downloadPath)) {
    console.log("downloadPath already exist");
    return downloadPath;
  }

  const tmpPath = `${downloadPath}.tmp`

  await fsExtra.remove(tmpPath)

  await downloadFile(fileUrl, tmpPath);

  await fsExtra.rename(tmpPath, downloadPath)

  console.log(`File downloaded successfully to ${downloadPath}`);
  return downloadPath;
}

export { download };
