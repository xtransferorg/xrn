import fs from "fs"
import glob from 'glob'
import * as fsExa from 'fs-extra'
import path from "path"
import logger from "../../utlis/logger";

function moveResToNative(sourceDirectory: string, destinationDirectory: string) {
    copyDirectory(sourceDirectory, destinationDirectory);
}

function copyDirectory(source: string, target: string) {
    if (!fs.existsSync(source)) {
        logger.info(`${source}不存在`)
        return
    }
    // 先确保目标目录存在
    if (!fs.existsSync(target)) {
        fs.mkdirSync(target);
    }

    const items = fs.readdirSync(source); // 读取源目录下的所有文件/文件夹
    for (const item of items) {
        const sourcePath = path.join(source, item);
        const targetPath = path.join(target, item);
        const stat = fs.statSync(sourcePath);
        if (stat.isDirectory()) {
            // 如果是目录，则递归调用
            copyDirectory(sourcePath, targetPath);
        } else if (stat.isFile()) {
            // 如果目标文件已经存在，则报错
            if (fs.existsSync(targetPath)) {
                if (!sourcePath.includes('node_modules')){
                    const isSameFile = fs.statSync(targetPath).size === stat.size; // 如果文件大小相同，则认为是同一个文件
                    if (!isSameFile){
                        throw new Error(`文件已存在，请检查打包产物: ${sourcePath}`);
                    } else {
                        // logger.warn(`文件已存在，且文件大小相同，请检查是否是相同文件: ${sourcePath}`);
                    }
                }
            }
            // 如果是文件，则复制
            fsExa.copySync(sourcePath, targetPath, { overwrite: true });

        }
    }
}


function removeDirAndCreateEmptyDir(path: string) {
    if (fs.existsSync(path)) {
        fs.rmdirSync(path, { recursive: true })
    }
    fs.mkdirSync(path)

}

function getBundleBaseLines(baseLinePath: string, environment: string, platform: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    (glob as any)(`${baseLinePath}/**/${environment}-${platform}*.txt`, { absolute: true }, (err, files) => {
      if (err) {
        reject(new Error('读取基线报错'))
      }

      resolve(files)
    });
  })
}

export { moveResToNative, removeDirAndCreateEmptyDir, getBundleBaseLines }
