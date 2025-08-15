import { COMMON_BASE_KEY } from "../../codePush/diff";
import { MetaConfig } from "./interface";

type Meta = {
  [COMMON_BASE_KEY]: MetaConfig;
  dependencies: Record<string, string>;
};

export class BaseLine {
  private meta: Meta = null;
  private static instance: BaseLine;
  private constructor() {}

  public static getInstance(): BaseLine {
    if (!BaseLine.instance) {
      BaseLine.instance = new BaseLine();
    }
    return BaseLine.instance;
  }

  public saveBaseMeta(meta: Meta): void {
    this.meta = meta;
  }

  public getBaseLine() {
    return this.meta?.[COMMON_BASE_KEY];
  }

  public getDependenciesJson() {
    return this.meta?.dependencies;
  }

  public hashBaseMeta() {
    return !!this.meta;
  }
}
