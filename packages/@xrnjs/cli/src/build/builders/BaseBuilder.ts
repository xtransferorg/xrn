import { MetaConfig } from "../bundle/interface";
import { BuildJobContext } from "../BuildJobContext";

export interface BuildResource {
  name: string;
  localPath: string;
  remotePathHint?: string;
  extra?: any;
}

export abstract class BaseBuilder {
  protected context: BuildJobContext;
  protected meta: MetaConfig;

  constructor(context: BuildJobContext, meta: MetaConfig) {
    this.context = context;
    this.meta = meta;
  }

  abstract build(): Promise<BuildResource[]>;
  abstract upload(
    resources: BuildResource[]
  ): Promise<{ link: string; filePath: string; fileName; channel?: string }[]>;

  async run(): Promise<{ link: string; filePath: string; channel: string }[]> {
    const resources = await this.build();
    const results = await this.upload(resources);
    return results.map(({ link, filePath, channel }) => ({
      link,
      filePath,
      channel: channel || this.context.channel,
    }));
  }
}
