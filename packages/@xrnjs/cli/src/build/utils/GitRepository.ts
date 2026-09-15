import fs from "fs-extra";
import * as path from "path";
import logger from "../../utlis/logger";
import { execShellCommand } from "./shell";

const WORKSPACE_DIR = process.cwd();
// 环境变量控制：如果仓库目录已存在，是否跳过重新 clone
const SKIP_CLONE_IF_EXISTS = process.env.SKIP_CLONE_IF_EXISTS === "true";

export class GitRepository {
  repositoryUrl: string;
  repositoryName: string;
  branchName: string;
  gitRepoPath: string;
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
    this.repositoryName = repositoryName || path.basename(repositoryUrl, ".git");
    this.branchName = branchName;
    this.gitRepoPath = path.join(WORKSPACE_DIR, this.repositoryName);
  }

  public async initRepository(): Promise<void> {
    if (!fs.existsSync(WORKSPACE_DIR)) {
      fs.mkdirSync(WORKSPACE_DIR, { recursive: true });
    }

    const repoExists = fs.existsSync(this.gitRepoPath);

    // 如果设置了 SKIP_CLONE_IF_EXISTS 且目录已存在，跳过克隆
    if (SKIP_CLONE_IF_EXISTS && repoExists) {
      logger.info(`Repository ${this.repositoryName} already exists, skipping clone (SKIP_CLONE_IF_EXISTS=true)`);
      const commitId = await execShellCommand(
        `git rev-parse HEAD`,
        { cwd: this.gitRepoPath }
      );
      this.latestCommitId = commitId.trim().replace("\n", "");
    } else {
      // 如果目录已存在，先删除
      if (repoExists) {
        logger.info(`Removing existing repository ${this.repositoryName}...`);
        fs.removeSync(this.gitRepoPath);
      }

      // 只克隆指定分支的最新一个 commit
      logger.info(`Cloning repository ${this.repositoryUrl} (branch: ${this.branchName}, depth: 1)...`);
      await execShellCommand(
        `git clone --depth 20 --branch ${this.branchName} --single-branch ${this.repositoryUrl} ${this.gitRepoPath}`,
        { cwd: WORKSPACE_DIR }
      );

      const commitId = await execShellCommand(
        `git rev-parse HEAD`,
        { cwd: this.gitRepoPath }
      );
      logger.info(`Repository ${this.repositoryName} commit id: ${commitId}`);
      this.latestCommitId = commitId.trim().replace("\n", "");
    }

    if (!this.latestCommitId) {
      throw new Error(
        `Failed to get the latest commit id of repository ${this.repositoryName}.`
      );
    }

    logger.info(`Repository ${this.repositoryName} is ready.`);
  }

  public getLatestCommitId() {
    return this.latestCommitId;
  }
}
