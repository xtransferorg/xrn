import fs from "fs-extra";
import gitclone from "git-clone/promise";
import path from "path";

import { BaseLineManager, UploadResult } from "./BaseLineManager";
import { execShellCommand } from "../../build/utils/shell";

export class GitBaseLineManager extends BaseLineManager {
  async uploadBaseLine(): Promise<UploadResult[]> {
    const dir = this.baseDir;
    await execShellCommand("git add .", { cwd: dir });
    await execShellCommand(
      `git commit -m "Codepush baseline update: ${this.config.app_name}-${this.config.app_version}-${this.config.environment}-${this.config.platform}"`,
      { cwd: dir },
    );
    await execShellCommand("git pull --rebase", { cwd: dir });
    await execShellCommand("git push", { cwd: dir });
    // 返回目录下所有文件信息
    const files = await fs.readdir(dir);
    return files.map((file) => {
      const stat = fs.statSync(path.join(dir, file));
      return {
        file_name: file,
        download_url: "",
        file_size: stat.size,
        description: "",
        created_at: new Date().toISOString(),
        upload_type: "new",
        app_version: this.config.app_version,
      };
    });
  }

  async downloadBaseLineToLocal(): Promise<void> {
    const targetDir = this.baseDir;
    // 假设this.config中有必要的信息拼接git地址
    const repoName = "xt-app-code-push-diff";
    const branch = "main";
    const gitUrl = `git@atta-gitlab.xtrfr.cn:atta-team/fe/app/${repoName}.git`;
    // 清理目标目录
    await execShellCommand(`rm -rf ${targetDir}/${repoName}`, {
      cwd: targetDir,
    });
    // 克隆仓库
    await gitclone(gitUrl, `${targetDir}/${repoName}`, {
      checkout: branch,
      shallow: false,
    });
  }
}
