import { execAsync, findWorkspacePackage } from "./utils";

interface PublishOptions {
  packageName: string;
  isBeta?: boolean;
}

export async function publishPackage({
  packageName,
  isBeta = false,
}: PublishOptions) {
  try {
    const pkgInfo = await findWorkspacePackage(packageName);
    if (!pkgInfo) {
      console.error(`${packageName} 不存在`);
      process.exit(1);
    }
    const catchedPath = process.cwd();
    process.chdir(pkgInfo.location);
    // 获取当前分支
    const { stdout } = await execAsync(`git rev-parse --abbrev-ref HEAD`);
    const branch = stdout.trim();
    const betaTag = "beta";

    console.info(`${packageName}-当前分支是：${branch}, betaTag是：${betaTag}`);

    const isStable = branch.endsWith("-stable");
    const isRelease = branch.endsWith("-release");

    // if (isBeta || isStable) {
    if (!isRelease) {
      await execAsync(
        `standard-version --prerelease ${betaTag} --release-as patch --tag-prefix "${packageName}@" --skip.changelog`,
      );
      await execAsync(`npm publish --tag beta`);

      await execAsync(`git push --follow-tags origin ${branch}`);
    } else if (isRelease) {
      await execAsync(
        `standard-version --tag-prefix "${packageName}-v" --release-as patch --skip.changelog`,
      );
      await execAsync(`npm publish`);
      await execAsync(`git push --follow-tags origin ${branch}`);
    } else {
      console.error(
        `${packageName}-当前分支不是 stable 或者 release 分支，不能发布`,
      );
      process.exit(1);
    }

    console.log(`${packageName}-更新版本成功`);

    process.chdir(catchedPath);

    // 更新依赖此包的版本
    await execAsync(`npx xrn-tools sync-dep-version ${packageName}`);

    await execAsync(`yarn install --no-immutable`, { stdio: "inherit" });

    // 有变更才提交
    const { stdout: out } = await execAsync(`git status --porcelain`);
    if (out.trim()) {
      await execAsync(`git add .`);
      await execAsync(`git commit -m "chore: 更新依赖版本"`);
      await execAsync(`git push origin ${branch}`);
    }
  } catch (error) {
    console.error("Error publishing package:", error);
    throw error;
  }
}
