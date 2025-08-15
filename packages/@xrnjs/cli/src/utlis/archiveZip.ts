import fs from "fs-extra";
import archiver from "archiver";

/**
 * Create a ZIP archive from a directory
 * Compresses all files and subdirectories in the source directory into a ZIP file
 * Uses maximum compression level (9) for optimal file size reduction
 * 
 * @param sourceDir - Path to the source directory to be archived
 * @param outputFilePath - Path where the ZIP file should be created
 * @returns Promise that resolves when the archive is complete
 * @throws Error if archiving fails or encounters non-ENOENT warnings
 */
function zipDirectory(
  sourceDir: string,
  outputFilePath: string
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const output = fs.createWriteStream(outputFilePath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => {
      console.log(archive.pointer() + " total bytes");
      resolve();
    });

    archive.on("warning", (err: any) => {
      if (err.code === "ENOENT") {
        console.warn(err);
      } else {
        reject(err);
      }
    });

    archive.on("error", (err) => {
      reject(err);
    });

    archive.pipe(output);

    archive.directory(sourceDir, false);

    archive.finalize();
  });
}

export { zipDirectory };
