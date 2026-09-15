import { BuildCommandOptions } from "../build/typing";

type BooleanString = "false" | "true";

export interface PublishCommandOptions extends BuildCommandOptions {
  changeLog: string;
  isBackwardCompatible: BooleanString;
  updateType: "Force" | "Silent";
  onlyApplyVersion: string;
  notOnlyApplyVersion: string;
  uploadToOSS: BooleanString;
  minSupportedVersion: string;
  /** 是否构建测试环境生产稳定版本app */
}

export interface CodePushResp<T> {
  code: number;
  message: string;
  data: T;
}

export interface CodePushReleaseData {
  is_backward_compatible: boolean;
  app_key: string;
  version_id: string;
  version_number: string;
  version_name: string;
  download_url: string;
  rollout: number;
  status: string;
  build_type: string;
  update_type: string;
  environment: string;
  changelog: string;
  updated_at: Date;
  created_at: Date;
  id: number;
}
