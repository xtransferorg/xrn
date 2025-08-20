// 根据 package.json 中的版本号，创建下一版本文档
import fsExtra from 'fs-extra';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { join } from 'path';
import semver from 'semver';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const packageJsonPath = join(dirname, '../package.json');

function getNextMajorVersion(currentVersion) {
  if (!semver.valid(currentVersion)) {
    throw new Error('Invalid version number');
  }
  const releaseType = 'major';
  const newVersion = semver.inc(currentVersion, releaseType);
  return newVersion;
}

function copyNextVersion() {
  const { version } = fsExtra.readJsonSync(packageJsonPath);
  const vLatestDoc = join('pages', 'versions', `v${version}/`);
  const vLatestData = join('public', 'static', 'data', `v${version}/`);
  // const latest = join('pages', 'versions', 'latest/');
  const nextDocs = join('pages', 'versions', `v${getNextMajorVersion(version)}/`);
  const nextData = join('public', 'static', 'data', `v${getNextMajorVersion(version)}/`);
  // removeSync(latest);
  fsExtra.copySync(vLatestDoc, nextDocs);
  fsExtra.copySync(vLatestData, nextData);
}

const upgradePackageJsonVersion = () => {
  const packageJson = fsExtra.readJsonSync(packageJsonPath);
  packageJson.version = getNextMajorVersion(packageJson.version);
  fsExtra.writeJsonSync(packageJsonPath, packageJson, { spaces: 2 });
};

// const generateStaticResources = () => {
//   execSync('yarn run generate-static-resources', { stdio: 'inherit', cwd: join(dirname, '..') });
// };

copyNextVersion();
upgradePackageJsonVersion();
// generateStaticResources();
