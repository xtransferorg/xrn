import fs from 'fs-extra';
import { Platform, RepInfo } from "../typing"
import gitclone from 'git-clone/promise';
import { execShellCommand } from './shell';
import logger from '../../utlis/logger';
import ora from "ora";
// import { timingTracker } from '../TimingTracker';


export const downloadTemplate = async (resInfo: RepInfo, downloadPath: string, platform: Platform) => {
    const branchPath = `${downloadPath}/${resInfo.name}/`
    if (!fs.existsSync(branchPath)) {
        fs.mkdirSync(branchPath, { recursive: true })

        const execLoad = ora(`git clone ${resInfo.name}`).start();
        try {
            // timingTracker.time(TimingTrackerStage.REPO_FETCH, resInfo.name)
            // shallow: false 会下载所有的commit，否则切换分支会失败
            await gitclone(resInfo.gitUrl, branchPath, { checkout: resInfo.branchName, shallow: false });
            // timingTracker.timeEnd(TimingTrackerStage.REPO_FETCH, resInfo.name)
            execLoad.succeed(`git clone ${resInfo.name}`);
            logger.info(`模板${resInfo.name}下载成功`);
        } catch (error) {
            execLoad.fail(`git clone ${resInfo.name}`);
            logger.error(`模板${resInfo.name}下载失败 ${error}`);
            fs.removeSync(branchPath)
        }
    } else {
        await checkoutBranch(resInfo.name, resInfo.branchName, platform)
    }
}

async function checkoutBranch(projectName: string, branchName: string, platform: Platform) {
    const cwd = process.cwd();
    const rootPath = `${cwd}/${projectName}`
    fs.removeSync(`${rootPath}/release_${platform}`)
    fs.removeSync(`${rootPath}/node_modules`)
    logger.info("checkoutBranch rootPath", {rootPath})
    await execShellCommand("git fetch", { cwd: rootPath })
    const commitId = await execShellCommand(`git rev-parse origin/${branchName}^{commit}`, { cwd: rootPath })
    const gitCheckoutCommand = `git checkout -f ${commitId}`
    return execShellCommand(gitCheckoutCommand, { cwd: rootPath })
}

export async function syncRepo(branchName: string, cwd = process.cwd()) {
    await execShellCommand("git fetch", { cwd, log: false }, true)
    const commitId = await execShellCommand(`git rev-parse origin/${branchName}^{commit}`, { cwd, log: false }, true)
    const gitCheckoutCommand = `git checkout -f ${commitId}`
    return execShellCommand(gitCheckoutCommand, { cwd, log: false }, true)
}

export { checkoutBranch }


