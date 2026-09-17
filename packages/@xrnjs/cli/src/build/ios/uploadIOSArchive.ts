import { zipDirectory } from "../../utlis/archiveZip";
import { buildJobContext } from "../BuildJobContext";
import fs from "fs-extra";

export const uploadIOSArchive = async (minor_version: string) => {
  const { rootPath, buildType, enableDsym, iosSimulator } = buildJobContext;
  const simulator = iosSimulator ? "_simulator" : "";
  const iOSArchivePath = `${rootPath}/iOS_Out_${buildType}${simulator}`;
//   const iOSArchivePath = `${rootPath}/iOS_Out_release`;
  const versionInfoPath = `${iOSArchivePath}/${minor_version}`;
  const xcarchivePath = `${iOSArchivePath}/${minor_version}.xcarchive`;

  // 如果 versionInfoPath 或 xcarchivePath 不存在, 则return
  if (!fs.existsSync(versionInfoPath) || !fs.existsSync(xcarchivePath)) {
    return;
  }

  if (!enableDsym) {
    return;
  }

  // 将versionInfoPath和xcarchivePath复制到 archive_info/ 文件夹, 压缩成zip文件

  const tmpArchiveDirectory = "archive_info";
  const zipFileName = `${minor_version}.zip`;

  await fs.ensureDir(tmpArchiveDirectory);
  await fs.copy(versionInfoPath, `${tmpArchiveDirectory}/${minor_version}`);
  await fs.copy(
    xcarchivePath,
    `${tmpArchiveDirectory}/${minor_version}.xcarchive`
  );
  await zipDirectory(`${tmpArchiveDirectory}`, zipFileName);

  // 保留本地归档压缩包，不执行远程上传
  await fs.remove(tmpArchiveDirectory);
};
