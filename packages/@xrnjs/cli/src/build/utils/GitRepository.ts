import fs from "fs-extra";
import * as path from "path";
import simpleGit, { SimpleGit } from "simple-git";
import gitclone from "git-clone/promise";
import logger from "../../utlis/logger";
// import { timingTracker } from "../TimingTracker";
// import { TimingTrackerStage } from "../typing";
import { execShellCommand } from "./shell";
import { isProd } from ".";
import { buildJobContext } from "../BuildJobContext";

// const isJenkinsEnv = !!process.env.JENKINS_HOME;
const WORKSPACE_DIR = process.cwd();
// const WORKSPACE_DIR = isJenkinsEnv
//   ? process.cwd()
//   : path.join(process.cwd(), "..");

export class GitRepository {
  repositoryUrl: string;
  repositoryName: string;
  branchName: string;
  gitRepoPath: string;
  git: SimpleGit;
  latestCommitId: string = "";

  constructor({
    branchName,
    repositoryUrl,
    repositoryName
  }: {
    repositoryUrl: string;
    branchName: string;
    repositoryName?: string
  }) {
    this.repositoryUrl = repositoryUrl;
    // this.repositoryName = path.basename(repositoryUrl, ".git");
    this.repositoryName = repositoryName || path.basename(repositoryUrl, ".git");
    this.branchName = branchName;
    this.gitRepoPath = path.join(WORKSPACE_DIR, this.repositoryName);
  }

  public async initRepository(): Promise<void> {
    if (!fs.existsSync(WORKSPACE_DIR)) {
      fs.mkdirSync(WORKSPACE_DIR, { recursive: true });
    }

    if (!fs.existsSync(this.gitRepoPath)) {
      logger.info(`Cloning repository ${this.repositoryUrl}...`);
      // TODO 为了防止老脚本的问题，这里暂时不使用 shallow
      await gitclone(this.repositoryUrl, this.gitRepoPath, {
        checkout: this.branchName,
        shallow: false,
      });
      const commitId = await execShellCommand(
        `git rev-parse origin/${this.branchName}^{commit}`,
        { cwd: this.gitRepoPath }
      );
      this.latestCommitId = commitId.trim().replace("\n", "");
    } else {
      this.git = simpleGit(this.gitRepoPath);

      await execShellCommand(`git fetch --depth=1 origin ${this.branchName}`, {
        cwd: this.gitRepoPath,
      });

      const commitId = await execShellCommand(`git rev-parse FETCH_HEAD`, {
        cwd: this.gitRepoPath,
      });
      this.latestCommitId = commitId.trim().replace("\n", "");

      const gitCheckoutCommand = `git checkout -f ${this.latestCommitId}`;
      await execShellCommand(gitCheckoutCommand, { cwd: this.gitRepoPath });

      await this.cleanRepository();
    }

    if (!this.latestCommitId) {
      throw new Error(
        `Failed to get the latest commit id of repository ${this.repositoryName}.`
      );
    }

    logger.info(`Repository ${this.repositoryName} is ready.`);
  }

  public async cleanRepository(): Promise<void> {
    try {
      //   删除 release_android 和 release_ios 目录

      fs.removeSync(`${this.gitRepoPath}/release_android`);
      fs.removeSync(`${this.gitRepoPath}/release_ios`);

      //   await this.git.checkout(".");
      //   await this.git.reset(ResetMode.HARD);
      await this.cleanUntrackedFiles();
      // 生产环境下，删除 node_modules 缓存
      if (isProd(buildJobContext.buildEnv)) {
        fs.removeSync(`${this.gitRepoPath}/node_modules`);
      }
      logger.info("Repository changes have been discarded.");
    } catch (err) {
      console.error("Error discarding repository changes:", err);
    }
  }

  private async cleanUntrackedFiles(): Promise<void> {
    try {
      const status = await this.git.status();
      const untrackedFiles = status.not_added;

      for (const file of untrackedFiles) {
        const filePath = path.resolve(this.gitRepoPath, file);
        if (await fs.pathExists(filePath)) {
          await fs.remove(filePath);
        //   logger.info(`Deleted untracked file: ${file}`);
        }
      }
    } catch (error) {
      console.error("Failed to clean untracked files:", error);
    }
  }

  public getLatestCommitId() {
    return this.latestCommitId;
  }
}
