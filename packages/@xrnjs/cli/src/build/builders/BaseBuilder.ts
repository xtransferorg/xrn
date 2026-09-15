import { BuildType } from "../typing";
import { BuildJobContext } from "../BuildJobContext";
import fs from "fs-extra";
import path from "path";
import { timingTracker } from "../TimingTracker";
import logger from "../../utlis/logger";
import { isProd } from "../utils";
import { COMMON_BASE_KEY } from "../../codePush/diff";

export interface BuildResource {
  name: string;
  localPath: string;
  extra?: any;
}

export interface ChannelFileMetadata {
  link: string;
  filePath: string;
  fileName;
  channel?: string;
  arch?: string;
  type?: string;
}

export abstract class BaseBuilder {
  protected context: BuildJobContext;

  constructor(context: BuildJobContext) {
    this.context = context;
  }

  /**
   * DEBUG 且非生产环境时，将 package.json dependencies 与 meta 写入平台资源目录下的 manifest（与 bundle 基线一致）。
   * @param manifestRelativePath 相对项目 rootPath 的目标文件路径
   */
  protected async writeDebugMetaManifest(
    manifestRelativePath: string
  ): Promise<void> {
    const { buildEnv, buildType, rootPath } = this.context;
    if (buildType !== BuildType.DEBUG || isProd(buildEnv)) {
      return;
    }
    const metaJson = {
      dependencies: require(path.join(rootPath, "package.json")).dependencies,
      [COMMON_BASE_KEY]: this.context.meta,
    };
    const dest = path.resolve(rootPath, manifestRelativePath);
    await fs.ensureDir(path.dirname(dest));
    await fs.writeFile(dest, JSON.stringify(metaJson), "utf-8");
  }

  abstract build(): Promise<BuildResource[]>;
  abstract upload(resources: BuildResource[]): Promise<ChannelFileMetadata[]>;

  /**
   * 清理 bundle 产物目录，在构建 bundle 前调用
   */
  abstract cleanBundleDir(): Promise<void>;

  async run(): Promise<ChannelFileMetadata[]> {
    const resources = await this.build();
    const results = await this.upload(resources);

    logger.info(
      `产物生成成功，产物列表：\n${results
        .map(
          (r) =>
            `- ${r.fileName} (${r.arch || r.type || "-"}) - ${r.link}`
        )
        .join("\n")}`
    );

    return results;
  }
}
