import { buildHarmony } from "../harmony/buildHarmony";
import { uploadFile } from "../utils/ftp";
import { BuildResource, BaseBuilder } from "./BaseBuilder";

export class HarmonyBuilder extends BaseBuilder {
  async build(): Promise<BuildResource[]> {
    const { fileName, filePath } = await buildHarmony();
    return [{ name: fileName, localPath: filePath }];
  }

  async upload(resources: BuildResource[]) {
    const file = resources[0];
    const link = await uploadFile(file.localPath);
    return [{ link, filePath: file.localPath, fileName: file.name, channel: this.context.channel }];
  }
} 