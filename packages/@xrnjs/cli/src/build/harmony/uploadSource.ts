import { buildJobContext } from "../BuildJobContext";
import fs from "fs-extra";
import path from "path";
import { BuildType } from "../typing";
import { zipDirectory } from "../../utlis/archiveZip";
import moment from 'moment';

/**
 * 生成鸿蒙 release 包的本地 sourceMap 压缩文件
 */
export const uploadHarmonySourceMap = async (product: string) => {
  const { rootPath, buildType, version } = buildJobContext;
  const formattedTimestamp = moment().format("YYYYMMDD-HHmmss");
  if (buildType !== BuildType.RELEASE) {
    return;
  }

  const rawOutputPath = `harmony/entry/build/${product}/cache/${product}/${product}@CompileArkTS/esmodule/release/`;

  // sourceMap 文件路径
  const mapPath = path.join(rootPath, rawOutputPath, "sourceMaps.map");
  const jsonPath = path.join(rootPath, rawOutputPath, "sourceMaps.json");

  if (!fs.existsSync(mapPath) || !fs.existsSync(jsonPath)) {

    return;
  }

  // 创建临时目录用于压缩
  const tmpDir = `harmony_sourcemap_tmp_${formattedTimestamp}`;
  await fs.ensureDir(tmpDir);
  await fs.copy(mapPath, path.join(tmpDir, "sourceMaps.map"));
  await fs.copy(jsonPath, path.join(tmpDir, "sourceMaps.json"));

  // 压缩文件
  const zipFileName = `${version}_${formattedTimestamp}.zip`;
  await zipDirectory(tmpDir, zipFileName);

  // 保留本地 sourceMap 压缩包，不执行远程上传
  await fs.remove(tmpDir);
};
