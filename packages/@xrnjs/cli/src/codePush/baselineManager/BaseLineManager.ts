import { Platform } from "../../build/typing";

export interface UploadResult {
  file_name: string;
  download_url: string;
  file_size: number;
  description: string;
  created_at: string;
  upload_type: string;
  app_version: any;
}

export interface QueryParams {
  file_names?: string[];
  app_version?: string;
  app_name?: string;
  platform?: string;
  channel?: string;
  environment?: string;
}

export interface QueryResult {
  file_name: string;
  download_url: string;
  file_size: number;
  description: string;
  created_at: string;
  upload_type: string;
  app_version: any;
}

export interface BaseLineConfig {
  app_version: string;
  app_name: string;
  platform: Platform;
  app_type: "Release" | "Debug";
  channel: string;
  environment: string;
  appKey?: string;
}

export abstract class BaseLineManager {
  protected baseDir = "xt-app-code-push-diff";
  protected config: BaseLineConfig;

  constructor(config: BaseLineConfig) {
    this.config = config;
  }

  abstract uploadBaseLine(): Promise<QueryResult[]>;
  abstract downloadBaseLineToLocal(): Promise<void>;
}
