import { BuildCommandOptions } from "../build/typing";

type BooleanString = "false" | "true";

/**
 * TypeScript type definitions for app publishing functionality
 * Defines interfaces and types used for app distribution and release management
 */

/**
 * Publish command options interface
 * Extends build options with publishing-specific configuration
 */
export interface PublishCommandOptions extends BuildCommandOptions {
  /** Change log for the release */
  changeLog: string;
  /** Whether the release is backward compatible */
  isBackwardCompatible: BooleanString;
  /** Type of update (force or silent) */
  updateType: "force" | "silent";
  /** Specific version to apply the update to */
  onlyApplyVersion: string;
  /** Versions to exclude from the update */
  notOnlyApplyVersion: string;
  /** Whether to upload to OSS (Object Storage Service) */
  uploadToOSS: BooleanString;
}

/**
 * CodePush API response wrapper
 * Standard response format for CodePush API calls
 * 
 * @template T - Type of the response data
 */
export interface CodePushResp<T> {
  /** Response status code */
  code: number;
  /** Response message */
  message: string;
  /** Response data payload */
  data: T;
}

/**
 * CodePush release data structure
 * Contains information about a specific app release
 */
export interface CodePushReleaseData {
  /** Whether the release is backward compatible */
  is_backward_compatible: boolean;
  /** App key identifier */
  app_key: string;
  /** Version ID */
  version_id: string;
  /** Version number */
  version_number: string;
  /** Version name */
  version_name: string;
  /** Download URL for the release */
  download_url: string;
  /** Rollout percentage */
  rollout: number;
  /** Release status */
  status: string;
  /** Build type (debug/release) */
  build_type: string;
  /** Update type */
  update_type: string;
  /** Environment (dev/staging/prod) */
  environment: string;
  /** Change log for the release */
  changelog: string;
  /** Last update timestamp */
  updated_at: Date;
  /** Creation timestamp */
  created_at: Date;
  /** Release ID */
  id: number;
}
