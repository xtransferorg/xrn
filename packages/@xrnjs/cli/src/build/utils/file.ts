import { Exception } from "handlebars";
import fs from "fs"
import { glob } from 'glob'
import * as fsExa from 'fs-extra'
import path from "path"
import logger from "../../utlis/logger";

async function moveResToNative(sourceDirectory: string, destinationDirectory: string) {
    await copyDirectory(sourceDirectory, destinationDirectory);
}

async function copyDirectory(source: string, target: string) {
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
            await copyDirectory(sourcePath, targetPath);
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
            fsExa.copySync(sourcePath, targetPath, { overwrite: true });
        }
    }
}


function readFilesRecursively(folderPath: string, resList: Array<string>) {
    try {
        // 读取文件夹中的文件列表
        const files = fs.readdirSync(folderPath);
        // 遍历文件列表
        files.forEach((file: string) => {
            // 拼接文件的完整路径
            const filePath = path.join(folderPath, file);
            // 获取文件的状态信息
            const stats = fs.statSync(filePath);
            // 判断是文件还是文件夹
            if (stats.isFile()) {
                // resList.push(`${bundleName}:${filePath}`)
                resList.push(filePath)
            } else if (stats.isDirectory()) {
                // 递归读取子文件夹中的文件
                readFilesRecursively(filePath, resList);
            }
        });
    } catch (err) {
        throw new Exception(`Error reading folder: ${err}`)
    }
}

// TODO 没用?
function getAllRes(folderPath: string, bundleName: string, resPathSplit: string): Array<string> {
    const resList = new Array<string>();
    readFilesRecursively(folderPath, resList)
    return resList.map(filePath => `${bundleName}:${filePath.split(resPathSplit).pop()}`)
}


function removeDirAndCreateEmptyDir(path: string) {
    if (fs.existsSync(path)) {
        fs.rmdirSync(path, { recursive: true })
    }
    fs.mkdirSync(path)

}

function getBundleBaseLines(baseLinePath: string, environment: string, platform: string): Promise<string[]> {
  return glob(`${baseLinePath}/**/${environment}-${platform}*.txt`, { absolute: true })
}

export { moveResToNative, getAllRes, removeDirAndCreateEmptyDir, getBundleBaseLines }
