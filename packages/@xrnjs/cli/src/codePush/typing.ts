import { BuildEnv, Platform } from "../build/typing";

/**
 * TypeScript type definitions for CodePush functionality
 * Defines interfaces and types used for hot update deployment and management
 */

/**
 * Parameters for CodePush deployment
 * Contains all configuration needed for publishing hot updates
 */
export interface CodePushParams {
    /** Private key for authentication */
    privateKey?: string,
    /** App identifier */
    app: string,
    /** Project name */
    projectName: string,
    /** Git branch name */
    branch: string,
    /** Whether this is an incremental update */
    isIncrement: boolean,
    /** Target platform */
    platform: Platform;
    /** Update description */
    desc: string;
    /** Build environment */
    env: BuildEnv;
    /** App version */
    appVersion: string;
    /** Whether update is mandatory */
    isMandatory: string
    /** Unique identifier for the update */
    uuid?: string
    /** Whitelist of device IDs */
    whiteList?: string
    /** Channel release ID */
    channelReleaseId?: string
    /** Rollout percentage */
    rollout?: string
    /** Whether to check for missing keys */
    checkMissingKeys?: boolean
    /** Whether to skip XTRN core version check */
    skipCheckXtRnCoreVersion?: boolean
    /** Whether this is a development build */
    isDev?: boolean
}

/**
 * CodePush deployment information
 * Represents a deployment configuration in CodePush
 */
export interface CodePushDeployment {
    /** Creation timestamp */
    createdTime: number;
    /** Deployment ID */
    id:          string;
    /** Deployment key */
    key:         string;
    /** Deployment name */
    name:        string;
    /** Associated package information */
    package:     CodePushPackage | null;
}

/**
 * CodePush package information
 * Contains details about a specific hot update package
 */
export interface CodePushPackage {
    /** Package description */
    description:        string;
    /** Whether package is disabled */
    isDisabled:         boolean;
    /** Whether update is mandatory */
    isMandatory:        boolean;
    /** Rollout percentage */
    rollout:            number;
    /** Target app version */
    appVersion:         string;
    /** Package hash for integrity */
    packageHash:        string;
    /** URL to package blob */
    blobUrl:            string;
    /** Package size in bytes */
    size:               number;
    /** URL to manifest blob */
    manifestBlobUrl:    string;
    /** Map of diff packages */
    diffPackageMap:     { [key: string]: CodePushDiffPackageMap };
    /** Release method used */
    releaseMethod:      string;
    /** Upload timestamp */
    uploadTime:         number;
    /** Original label */
    originalLabel:      string;
    /** Original deployment name */
    originalDeployment: string;
    /** Current label */
    label:              string;
    /** User who released the update */
    releasedBy:         string;
    /** Update metrics */
    metrics:            CodePushMetrics;
}

/**
 * CodePush diff package mapping
 * Contains information about differential update packages
 */
export interface CodePushDiffPackageMap {
    /** Package size in bytes */
    size: number;
    /** Download URL */
    url:  string;
}

/**
 * CodePush update metrics
 * Tracks the performance and adoption of hot updates
 */
export interface CodePushMetrics {
    /** Number of active installations */
    active:      number;
    /** Number of downloads */
    downloaded:  number;
    /** Number of failed installations */
    failed:      number;
    /** Number of successful installations */
    installed:   number;
    /** Total number of active installations */
    totalActive: number;
}
