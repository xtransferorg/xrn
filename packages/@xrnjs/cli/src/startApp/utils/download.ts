/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import fs from "fs";
import path from "path";
import axios from "axios";
import ProgressBar from "progress";
import fsExtra from 'fs-extra'
import os from "os";

/**
 * Download a file from URL with progress bar display
 * Downloads a file and shows download progress in the terminal
 * 
 * @param fileUrl - URL of the file to download
 * @param downloadPath - Local path where the file should be saved
 * @returns Promise that resolves when download is complete
 */
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

/** Default download directory for app files */
const appDownloadDir = path.join(os.tmpdir(), 'xrn-app-download-dir');

/**
 * Download a file from URL with caching and error handling
 * Downloads files to a temporary directory and caches them to avoid re-downloading
 * Uses atomic file operations to prevent corruption during download
 * 
 * @param fileUrl - URL of the file to download
 * @param downloadDir - Directory to save the file (defaults to temp directory)
 * @returns Promise resolving to the local file path
 * @throws Error if URL is not provided or download fails
 */
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

  // Return cached file if it already exists
  if (fs.existsSync(downloadPath)) {
    console.log("downloadPath already exist");
    return downloadPath;
  }

  // Use temporary file for atomic download
  const tmpPath = `${downloadPath}.tmp`

  await fsExtra.remove(tmpPath)

  await downloadFile(fileUrl, tmpPath);

  // Atomic rename to prevent corruption
  await fsExtra.rename(tmpPath, downloadPath)

  console.log(`File downloaded successfully to ${downloadPath}`);
  return downloadPath;
}

export { download };
